#!/usr/bin/perl
use strict;
use warnings;
use utf8;
use CGI qw(:standard);
binmode(STDIN,  ":encoding(utf8)");
binmode(STDOUT, ":encoding(utf8)");

my $cgi = new CGI::Pages();
my ($file, $question, $answer) = $cgi->get_form(qw/file question answer/);

my %METADATA = (
    title    => "Klingon Transcript Download",
    year     => "1998-2022",
    updated  => "2022-07-10T12:32:10+0200",
    logolink => ".",
    basedir  => "..",
    crumbs   => [
        "canon/"      => "Archive of Okrandian Canon",
        "canon/$file" => "Klingon Transcript Download",
    ],
);

=pod

TODO

  * Allow user with Google user agent string to access docs
  * Make sure length() is UTF-8 aware at all times
  * Encrypt access cookie
  * error_page() need prettification and CSS

=cut

##############################################################################
##                                                                          ##
##  Page Header / Footer Module                                             ##
##                                                                          ##
##############################################################################
{
    package Local::Page;

    sub new {
        my ($class, %opt) = @_;
        return bless({}, $class)->set(%opt);
    }

    sub set {
        my ($self, %opt) = @_;
        @$self{ keys %opt } = values %opt;
        return $self;
    }

    # Usage: $TEXTDATE = _text_date($ISODATE);
    #
    # Converts datestring (beginning with a YEAR-MM-DD) into a descriptive
    # plain text date like "January 1, 2012". Only year, month and day is
    # included, and anything coming after the initial date in $ISODATE is
    # ignored.
    my @month = qw(
        January   February  March      April    May       June
        July      August    September  October  November  December
    );
    sub _text_date {
        my ($date) = @_;
        # Accepts only ISO dates beginning with "1999-12-31"
        if ($date =~ m/^(\d{4})-0?(\d{1,2})-0?(\d{1,2})/) {
            my ($year, $month, $day) = ($1, $2, $3);
            return "$month[$month - 1] $day, $year";
        }
        return "UNKNOWN DATE";
    }

    sub _breadcrumbs {
        my @temp = ("" => "Home", @_);
        my @crumbs;
        while (my ($path, $title) = splice(@temp, 0, 2)) {
            my $attr = (@temp == 0) ? " itemprop=url" : "";
            push @crumbs,
                qq(<a href="http://klingonska.org/$path"$attr>$title</a>);
        }
        return join(qq( ›\n        ), @crumbs);
    }

    sub header {
        my ($self) = @_;
        my $isodate    = $self->{updated};
        my $text_date  = _text_date($isodate);
        my $basedir    = $self->{basedir};
        my $logolink   = $self->{logolink};
        my $crumbs     = _breadcrumbs(@{ $self->{crumbs} });
        my $h1_title   = $self->{title};
        (my $year = $self->{year}) =~ s/[[:punct:]]+/–/;
        my $head_title = do {
            local $_ = $self->{title};
            s#<.*?>##g;
            $_;
        };
        return <<"EOF";
<!DOCTYPE html>
<!-- Copyright $year by zrajm. License: CC BY-SA (text), GPLv2 (code) -->
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>$head_title – Klingonska Akademien</title>
<link rel=stylesheet href="$basedir/includes/base.css">
<link rel=stylesheet href="$basedir/includes/banner.css">
<link rel=stylesheet href="$basedir/includes/dict.css">
<link rel=stylesheet href="$basedir/includes/dict-layouttable.css">
<link rel=stylesheet href="$basedir/includes/canon-search.css">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
<link rel="manifest" href="/site.webmanifest">
<link rel="mask-icon" href="/safari-pinned-tab.svg" color="#bb3333">
<meta name="msapplication-TileColor" content="#bb3333">
<meta name="theme-color" content="#bb3333">
<link rel=canonical href="http://klingonska.org/">
<header role=banner>
  <!-- begin:status -->
  <ul>
    <li>
      <nav itemprop=breadcrumb role=navigation>
        $crumbs
      </nav>
    <li>
      Updated <time pubdate itemprop=dateModified datetime="$isodate">$text_date</time>
  </ul>
  <!-- end:status -->
  <div>
    <a href="$logolink">
      <table id=logotitle>
        <td>
          <span class=crop>
            <img height=200 width=200 src="$basedir/pic/ka-logo.svg" alt="Klingonska Akademien">
          </span>
        <td>
          <h1>Klingonska<span id=logospace>&nbsp;</span>Akademien</h1>
      </table>
    </a>
  </div>
</header>

<div role=main itemprop=mainContentOfPage>

<h1>$h1_title</h1>
EOF
    }

    sub footer {
        my ($self) = @_;
        my ($year1, $year2) = $self->{year} =~ /(\d+)[[:punct:]]+(\d+)/;
        my $basedir = $self->{basedir};
        return <<"EOF";
</div>

<footer role=contentinfo>
  <p class=copyright>© <time itemprop=copyrightYear>$year1</time>–<time>$year2</time> by
    <a href="mailto:zrajm\@klingonska.org" rel=author itemprop=author>zrajm</a>,
    <a href="http://klingonska.org/" itemprop=sourceOrganization>Klingonska Akademien</a>, Uppsala
  <p>License: <a href="http://creativecommons.org/licenses/by-sa/3.0/" rel=license>CC BY-SA</a>
</footer>
<script src="$basedir/includes/titlewrap.js"></script>
<!--[eof]-->
EOF
    }

    1;
}

##############################################################################
##                                                                          ##
##  CGI                                                                     ##
##                                                                          ##
##############################################################################
{
    package CGI::Pages;
    use CGI qw(-nosticky);
    use CGI::Cookie;

    # Usage: $OBJ = new CGI::Pages();
    #
    # Reads form values and cookies, and sets up a list of cookies which should
    # be fed back into the HTTP header (initially this is empty, but each call
    # to will add the added/changed cookie to the list).
    sub new {
        my ($class) = @_;
        my $cgi     = new CGI();
        return bless({
            cgi        => $cgi,
            form       => scalar($cgi->Vars()),
            cookie     => scalar(CGI::Cookie->fetch()) || {},
            set_cookie => {},                  # changed cookies list
        }, $class);
    }

    # Usage: @VALUE = $OBJ->get_form($NAME...);
    #        $VALUE = $OBJ->get_form($NAME);
    #        @NAME  = $OBJ->get_form();
    #
    # If $NAME is specified, returns that form value, returns undef if $NAME
    # does not exist. If no $NAME is given returns a list of the form values
    # currently available. If more than one $NAME is given, return those names
    # in order (in scalar context only the first $NAME is returned).
    sub get_form {
        my ($self, @name) = @_;
        return keys(%{$self->{form}}) unless @name;
        return map { $self->{form}{$_} } @name if wantarray();
        return $self->{form}{$name[0]};
    }

    # Usage: $VALUE = $OBJ->set_form($NAME, $VALUE);
    #        $VALUE = $OBJ->set_form($NAME);
    #
    # Sets or clears the $NAME:d form value. can be set, not expire times etc.
    # If $VALUE is not provided, form value will be deleted.
    sub set_form {
        my ($self, $name, $value) = @_;
        if (defined($value)) {
            $self->{form}{$name} = $value;
        } else {
            delete($self->{form}{$name});
        }
        return $value;
    }

    # Usage: $VALUE = $OBJ->get_cookie($NAME);
    #        @NAME  = $OBJ->get_cookie();
    #
    # If $NAME is specified, returns that cookie, returns undef if $NAME does
    # not exist. If no $NAME is given returns a list of the cookies currently
    # available.
    #
    # NOTE: This is a very simple funcion, it only returns the cookie values,
    # not expire times or anything else. Only scalar value cookies are
    # supported (neither hashes or list values are allowed).
    sub get_cookie {
        my ($self, $name) = @_;
        return undef unless exists($self->{cookie}{$name});
        return defined($name)
            ? $self->{cookie}{$name}->value() # named cookie value
            : keys(%{$self->{cookie}});       # list of cookie names
    }

    # Usage: $VALUE = $OBJ->set_cookie($NAME, $VALUE);
    #        $VALUE = $OBJ->set_cookie($NAME);
    #        @NAME  = $OBJ->set_cookie();
    #
    # Sets or clears the $NAME:d cookie. Only the actual value of the cookie
    # can be set, not expire times etc. If $VALUE is not provided, cookie will
    # be deleted.
    #
    # If no argument is given at all, returns names of all cookies that has
    # been updated since script was invoked (i.e. the cookies that should be
    # included in the outgoing HTTP header).
    sub set_cookie {
        my ($self, $name, $value) = @_;
        # no name provided, return list of changed cookies
        return keys(%{$self->{set_cookie}}) unless defined($name);
        # set or delete cookie
        $self->{set_cookie}{$name} = 1;
        if (defined($value)) {
            $self->{cookie}{$name} = new CGI::Cookie(
                -name  => $name,
                -value => $value,
            );
        } else {
            delete($self->{cookie}{$name});
        }
        return $value;
    }

    # Usage: $HTTP_PAGE = $OBJ->page([{ OPTION => "VALUE",...},] $HTML);
    #
    # Returns $HTML + its HTTP header. The header will default to using UTF-8,
    # and specifying "Content-Length", it will also include any cookies set
    # (with set_cookie()). Any provided OPTION => "VALUE" pairs are passed to
    # CGI::header() as-is. (Useful for e.g. specifying different MIME type,
    # e.g. `-type => "text/plain"`.)
    sub page {
        my $self = shift();
        my %opt  = (ref($_[0]) eq "HASH") ? %{shift()} : ();
        my $html = "@_";
        my @cookie = map {                     # for each modified cookie
            exists($self->{cookie}{$_})
                ? $self->{cookie}{$_}          #   set cookies /
                : new CGI::Cookie(             #   clear deleted cookies
                    -expires => 0,
                    -name    => $_,
                    -value   => "",
                );
        } $self->set_cookie();
        $opt{-charset}        = "utf-8";
        $opt{-content_length} = bytes::length($html);
        $opt{-cookie}         = \@cookie if @cookie;
        return $self->{cgi}->header(\%opt) . $html;
    }

    1;
}

##############################################################################
##                                                                          ##
##  Functions                                                               ##
##                                                                          ##
##############################################################################

# Usage: $BOOL = is_authorized($FILE, $ACCESS_COOKIE);
#
# $FILE is the filename of a canon klingon transcript (it should not include
# any path). $ACCESS_COOKIE is the authorization cookie used to determine if
# user is allowed to access that document ($ACCESS_COOKIE is allowed to be null
# or undef).
#
# Returns TRUE if $ACCESS_COOKIE contains permission to access $FILE, FALSE
# otherwise. Only TKD, TKW, KGT, CK and PK requires any authentication.
#
# Returns TRUE if $FILE does not require authentication.
#
# FIXME: The ACCESS_COOKIE is currently *very* simplistic. It should probably
# be improved (or at least obfuscated) somewhat.
sub is_authorized {
    my ($file, $cookie) = @_;
    my ($abbr) = $file =~ m/^\d{4}-\d{2}-\d{2}-(tkd|tkw|kgt|ck|pk)\.txt$/;
    return 1 unless defined($abbr);      # non-TKD/TKW/KGT = always okay
    return 0 unless defined($cookie);    # cookie not set
    return 1 if $cookie =~ m/\b$abbr\b/; # cookie contains TKD/TKW/KGT
    return 0;
}

# FIXME could be prettier w/ CSS and shit
sub error_page {
    return escapeHTML("@_");
}

sub question_page {
    my ($file, $message) = @_;
    my $ques = question();                      # random question
    my ($book, $sect, $para, $line, $word) = split(/_/, $ques);
    $sect =~ s/x/./g;
    my $page = Local::Page->new(%METADATA);
    return $page->header
        . (defined($message) and do {
            qq(<div style="background:pink; padding:.25em .5em; )
                . qq(font-weight:bold;">$message</div>\n);
        })
        . <<"EOF" . $page->footer();

<p>For copyright reasons you must own a copy of Marc Okrand’s book <i>The
Klingon Dictionary</i> to access this document. To certify that this is the
case, please enter the specified word from the main text of TKD below.

<div align=center>
  <form method=post action="">
    <h3>$book, section $sect, paragraph $para, line $line, word $word</h3>
    <input type=hidden name=file value="$file">
    <input type=hidden name=question value="$ques">
    <input name=answer placeholder="Enter word…" autofocus>
    <button type=submit>Reply</button>
  </form>
</div>

<p>When counting paragraphs, start after section title, skip Klingon example
phrases. Hyphenated words counts as one. Half word at beginning of line
counts. <i>Case counts.</i>
EOF
}

sub transcript_page {
    my ($file) = @_;
    if (not defined($file)) {
        die "No file specified\n";
    } elsif ($file !~ /^([a-z0-9-]*\.txt)$/) {
        die "Bad filename “$file”\n";
    } elsif (not -e $file) {
        die "File “$file” does not exist\n";
    }
    local $/ = undef;
    open(my $in, "<:utf8", $file) or die "Failed to open file “$file”: $!\n";
    $! = undef;
    my $transcript = readline($in);
    $! and die "Failed to read file “$file”: $!\n";
    return $transcript;
}

# Usage: $QUESTION = question();
#        $ANSWER   = question($QUESTION);
#
# If called with no arguments, return the name of a random $QUESTION. If
# $QUESTION argument is supplied, returns the answer to that question.
sub question {
    my ($question, $answer) = @_;
    my %question = (
        # book_page_paragraph_line_word => "Word",
        TKD_3x2x1_4_2_4 => "earthworm",
        TKD_3x3x2_1_3_4 => "Unlike",
        TKD_3x3x3_3_2_8 => "accurately",
        TKD_3x3x4_1_1_6 => "class",
        TKD_3x3x6_1_4_4 => "classification",
        TKD_4_1_1_5     => "monosyllabic",
        TKD_4x1x1_1_2_4 => "chart",
        TKD_3x3x5_5_1_7 => "happening",
        TKD_3x4_1_1_2   => "combinations",
        TKD_3x4_1_5_6   => "construct",
        TKD_4x1_1_2_3   => "what",
        TKD_4x2x2_1_2_7 => "predisposed",
        TKD_4x3_1_2_3   => "lengwI'mey",
        TKD_4x3_2_1_7   => "negation",
        TKD_5_1_1_4     => "bulk",
        TKD_5x1_2_1_3   => "chaH",
        TKD_5x3_2_1_3   => "joining",
        TKD_5x6_1_3_3   => "languages",
        TKD_5x6_1_4_2   => "suggest",
        TKD_5x6_2_2_4   => "spellings",
        TKD_6_1_6_3     => "eloquently",
        TKD_6x2x1_1_2_1 => "compound",
        TKD_6x2x2_2_2_3 => "qara'DI'",
        TKD_6x2x3_3_1_3 => "head",
        TKD_6x2x5_5_2_1 => "prisoners",
        TKD_6x4_1_2_2   => "yes",
        TKD_6x5_1_1_5   => "appropriate",
        TKD_6x6_2_1_3   => "formula",
        TKD_7x1_1_2_4   => "off",
        TKD_7x2_1_2_1   => "clipping",
    );
    if (@_ == 0) {                # return random question
        my @question = keys(%question);
        return $question[int(rand(@question))];
    };
    if (@_ == 2) {
        return 1 if defined($answer)
            and     defined($question)
            and     exists($question{$question})
            and $answer eq $question{$question};
        return "";
    }
    if (defined($question)) {     # return answer to given question
        return $question{$question} if exists($question{$question});
    }
    return undef;
}

##############################################################################
##                                                                          ##
##  Main                                                                    ##
##                                                                          ##
##############################################################################

$SIG{__DIE__} = sub {                          # show msg in Apache on die()
    print $cgi->page(error_page(@_));
    exit;
};

# get cookie & form values
my $cookie = $cgi->get_cookie("own");

# no file provided -- redirect to page for choosing file
if (not defined $file) {
    print redirect('http://' . ($ENV{HTTP_HOST} || 'localhost') .
        '/download.html');
    exit;
}

# cookie provided -- check it
if (defined $cookie) {
    # FIXME: if $file is unset, display file selector form
    if (is_authorized($file, $cookie)) {
        print $cgi->page({ -type => "text/plain" }, transcript_page($file));
    } else {
        $cgi->set_cookie(own => undef);        # clear bad cookie
        print $cgi->page(question_page($file,
            "Bad content »$cookie« in auth cookie."));
    }
    exit;
}

# answer provided -- check it
if (defined $question) {
    if (question($question, $answer)) {
        $cgi->set_cookie(own => "tkd tkw kgt ck pk");
        print $cgi->page({ -type => "text/plain" }, transcript_page($file));
    } else {
        $cgi->set_cookie(own => undef);        # clear cookie
        print $cgi->page(question_page($file,
            "Incorrect answer »$answer«. Please try again."));
    }
    exit;
}

# nothing provided
print $cgi->page(question_page($file));

#[eof]
