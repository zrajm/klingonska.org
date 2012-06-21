#!/usr/bin/perl -Tw
use strict;
$|++;
use utf8;
binmode(STDOUT, ":encoding(utf8)");

=pod

TODO

  * Allow user with Google user agent string to access docs
  * Make sure length() is UTF-8 aware at all times
  * Encrypt access cookie
  * error_page() need prettification and CSS
  * question_page() need prettification and CSS
  * question_page should have a note about cookie use

=cut


###############################################################################
##                                                                           ##
##  CGI                                                                      ##
##                                                                           ##
###############################################################################

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


###############################################################################
##                                                                           ##
##  Main                                                                     ##
##                                                                           ##
###############################################################################

my $cgi    = new CGI::Pages();
$SIG{__DIE__} = sub {                          # show msg in Apache on die()
    print $cgi->page(error_page(@_));
    exit;
};

# get cookie & form values
my $cookie = $cgi->get_cookie("own");
my ($file, $question, $answer) = $cgi->get_form(qw/file question answer/);

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
            "Incorrect answer »$answer«. Please, try again."));
    }
    exit;
}

# nothing provided
print $cgi->page(question_page($file));
exit;


###############################################################################
##                                                                           ##
##  Functions                                                                ##
##                                                                           ##
###############################################################################

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


sub page_header {
    my ($file) = @_;
    # <!-- begin:status -->
    # <div id="pagestats">
    #   <span id="crumbs">
    #     <a href="http://klingonska.org/">Home</a> &gt;
    #     <a href="http://klingonska.org/canon/">Archive of Okrandian Canon</a> &gt;
    #     <a href="http://klingonska.org/canon/$file">$file</a>
    #   </span>
    #   <span id="pubdate">
    #     Updated <time pubdate datetime="2007-07-15T05:44">July 15, 2007</time>
    #   </span>
    # </div>
    # <!-- end:status -->
    my $url = 'http://klingonska.org';
    return div({ -id => 'head' },
        comment('begin:status'),
        div({ -id => 'pagestats' },
            span({ -id => 'crumbs' },
                 a({ href => "$url/"       }, 'Home'), '&gt;',
                 a({ href => "$url/canon/" }, 'Archive of Okrandian Canon'), '&gt;',
                 defined($file)
                     ? a({ href => "$url/canon/$file"    }, $file)
                     : a({ href => "$url/canon/show.cgi" }, 'Transcript Download')
            ), span({ id => 'pubdate' }, 'Updated', Time({
                -datetime => '2012-05-13T02:54',
                -pubdate  => undef,
            }, 'May 13, 2012'))),
        comment('end:status'),
        p({ -align => 'center' }, a({ -href => '..' }, img({
            -alt    => 'Klingonska Akademien',
            -border => '0',
            -height => '176',
            -src    => '/pic/ka.gif',
            -vspace => '5',
            -width  => '600',
        })))
    );
}

sub page_footer {
    my ($place) = @_;
    return div({ -id => "foot" },
        p({ class => 'copyright' },
            '&copy;1998&ndash;2011, Copyright ',
            span({ -class => 'author' },
                 a({ -href => 'mailto:zrajm@klingonska.org' }, 'Zrajm C Akfohg')
            ) . ', ' .
            a({ -href => 'http://klingonska.org/' }, 'Klingonska Akademien') .
            ', Uppsala') .
        p({ class => 'validator' },
            'Validate:',
            a({
                -href => "http://validator.w3.org/check?uri=$place",
            }, 'XHTML') . ',',
            a({
                -href => 'http://jigsaw.w3.org/css-validator/validator' .
                    "?uri=$place&amp;profile=css3",
            }, 'CSS3') . ',',
            a({
                -href => "http://validator.w3.org/checklink?uri=$place"
            }, 'links') . '.',
            'License:',
            a({
                -href => 'http://creativecommons.org/licenses/by-sa/3.0/',
                -rel  => 'license',
            }, 'CC BY&ndash;SA') . '.')
    );
}

# FIXME could be prettier w/ CSS and shit
sub question_page {
    my ($file, $message) = @_;
    my $question = question();                 # random question
    my $answer   = undef;                      # clear answer
    my ($book, $section, $paragraph, $line, $word) = split(/_/, $question);
    $section =~ s/x/./g;
    my $place = 'http://' . ($ENV{HTTP_HOST} || 'localhost') .
        ($ENV{REQUEST_URI} || '');
    use CGI qw(:standard Time); # "Time" is custom function for microdata
    return
        start_html({
            -style => { src => [
                '../includes/page.css',
                '../includes/pagestats.css',
            ]}, -title => 'Klingon Transcript Download' }) .
        page_header($file) .
        div({ -id => 'main' },
            (defined($message) and p({ -style =>
                'background-color: pink;' .
                'padding: .5em;' .
                'font-weight: bold;'
            }, $message)) .
            p({ -align => 'justify' },
                'For copyright reasons you must own a copy of Marc',
                'Okrand&rsquo;s book', i('The Klingon Dictionary'), 'to',
                'access this document. To certify that this',
                'is the case, please enter the specified word from the main',
                'text of TKD below.',
            ) .
            div({ -align => 'center' },
                start_form({ -action  => '', -method  => 'POST' }),
                h3(escapeHTML("$book, section $section, paragraph $paragraph, " .
                    "line $line, word $word")) .
                p({ class => 'center' },
                    hidden({
                        -name     => 'file',
                        -override => 1,
                        -value    => $file }) .
                    hidden({
                        -name     => 'question',
                        -override => 1,
                        -value    => $question }) .
                    textfield({
                        -autofocus   => 'autofocus',
                        -name        => 'answer',
                        -override    => 1,
                        -placeholder => 'Enter word…',
                        -value       => $answer }) .
                    submit({ -value => 'Reply' })),
                end_form(),
            ) .
            p({ -align => 'justify' },
                'When counting paragraphs, start after section title, ',
                'skip Klingon example phrases. Hyphenated words counts as ',
                'one. Half word at beginning of line counts.', i('Case counts.'),
            )
        ) .
        page_footer($place) .
        end_html();
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

#[eof]
