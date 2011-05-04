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

    # Usage: $VALUE = $OBJ->get_form($NAME);
    #        @NAME  = $OBJ->get_form();
    #
    # If $NAME is specified, returns that form value, returns undef if $NAME
    # does not exist. If no $NAME is given returns a list of the form values
    # currently available.
    sub get_form {
        my ($self, $name) = @_;
        return defined($name)
            ? $self->{form}{$name}            # named form value
            : keys(%{$self->{form}});         # list of form value names
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

my $cgi   = new CGI::Pages();
my $file  = $cgi->get_form("file");            # transcript file name
$SIG{__DIE__} = sub {                          # show msg in Apache on die()
    print $cgi->page(error_page(@_));
    exit(0);
};

# cookie provided -- check it
if (defined(my $cookie = $cgi->get_cookie("own"))) {
    if (auth_file($file, $cookie)) {
        print $cgi->page({ -type => "text/plain" }, transcript_page($file));
    } else {
        $cgi->set_cookie(own => undef);        # clear bad cookie
        print $cgi->page(question_page($file,
            "Bad content »$cookie« in auth cookie."));
    }
    exit;
}

# answer provided -- check it
if (defined(my $question = $cgi->get_form("question"))) {
    my $answer = $cgi->get_form("answer");
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

# Usage: $BOOL = auth_file($FILE, $ACCESS_COOKIE);
#
# $FILE is the filename of a canon klingon transcript (it should not include
# any path). $ACCESS_COOKIE is the authorization cookie used to determine if
# user is allowed to access that document ($ACCESS_COOKIE may be null or
# undef).
#
# Returns TRUE if $ACCESS_COOKIE contains permission to access $FILE, FALSE
# otherwise. Only TKD, TKW, KGT, CK and PK requires any authentication.
#
# Returns TRUE if $FILE does not require authentication.
#
# FIXME: The ACCESS_COOKIE is currently *very* simplistic. It should probably
# be improved (or at least obfuscated) somewhat.
sub auth_file {
    my ($file, $cookie) = @_;
    my ($abbr) = $file =~ m/^\d{4}-\d{2}-\d{2}-(tkd|tkw|kgt|ck|pk)\.txt$/;
    return 1 unless defined($abbr);      # non-TKD/TKW/KGT = always okay
    return 0 unless defined($cookie);    # cookie not set
    return 1 if $cookie =~ m/\b$abbr\b/; # cookie contains TKD/TKW/KGT
    return 0;
}

# FIXME could be prettier w/ CSS and shit
sub error_page {
    my $message = escapeHTML("@_");
    return $message;
}

# FIXME could be prettier w/ CSS and shit
sub question_page {
    my ($file, $message) = @_;
    my $question = question();                 # random question
    my $answer   = undef;                      # clear answer
    my ($book, $page, $paragraph, $line, $word) = split(/_/, $question);
    my $place = "http://$ENV{HTTP_HOST}$ENV{REQUEST_URI}";
    use CGI ":standard";
    return
        start_html({
            -style => { src => "../includes/page.css" },
            -title => "Access Form",
        }) .
        div({ -id => "head" },
            table({ -class => "status" },
                Tr(
                    td({ -class => "left" },
                        a({ -href => 'mailto:webmaster@klingonska.org' },
                            'webmaster@klingonska.org'),
                    ),
                    td({ -class => "right" },
                        a({ -href => $place }, $place),
                    ),
                )
            ),
            p({ -align => "center" },
                a({ -href => ".." },
                    img({
                        -alt    => "Klingonska Akademien",
                        -border => "0",
                        -height => "176",
                        -src    => "/pic/ka.gif",
                        -vspace => "5",
                        -width  => "600",
                    })
                )
            )
        ) .
        div({ -id => "main" },
            (defined($message) and p({
                -style =>
                    "background-color: pink;" .
                    "padding: .5em;" .
                    "font-weight: bold;"
            }, $message)) .
            p({ -align => "justify" },
                "For copyright reasons you must own a copy of Marc",
                "Okrand&rsquo;s book", i("The Klingon Dictionary"), "to",
                "access this document. To certify that this",
                "is the case, please enter the specified word from the main",
                "text of the TKD below.",
            ) .
            div({ -align => "center" },
                start_form({
                    -action  => "",
                    -method  => "POST",
                }),
                h3(escapeHTML(
                    "$book, " .
                    "page $page, " .
                    "paragraph $paragraph, " .
                    "line $line, " .
                    "word $word:"
                )) .
                p({ class => "center" },
                    hidden({
                        -name     => "file",
                        -override => 1,
                        -value    => $file,
                    }) .
                    hidden({
                        -name     => "question",
                        -override => 1,
                        -value    => $question,
                    }) .
                    textfield({
                        -autofocus   => "autofocus",
                        -name        => "answer",
                        -override    => 1,
                        -placeholder => "Enter word",
                        -value       => $answer,
                    }) .
                    submit({ -value => "Reply" })
                ),
                end_form(),
            ) .
            p({ -align => "justify" },
                "When counting paragraphs, skip Klingon example phrases.",
                "Hyphenated words counts as one. Ending paragraphs at the",
                "top of a page are counted, as well as half words at",
                "beginning of line.", i("Case counts."),
            )
        ) .
        div({ -id => "foot" },
            p({ class => "copyright" },
                "&copy;1998&ndash;2011, Copyright ",
                span({ -class => "author" },
                     a({ -href => 'mailto:zrajm@klingonska.org' },
                       "Zrajm C Akfohg"
                     )
                ) . ", " .
                a({ -href => 'http://klingonska.org/' },
                    "Klingonska Akademien"
              ) . ", Uppsala"
            ) .
            p({ class => "validator" },
                "Validate:",
                a({
                    -href => "http://validator.w3.org/check?uri=$place",
                }, "XHTML") . ",",
                a({
                    -href => "http://jigsaw.w3.org/css-validator/validator" .
                        "?uri=$place&amp;profile=css3",
                }, "CSS3") . ",",
                a({
                    -href => "http://validator.w3.org/checklink?uri=$place"
                }, "links") . ".",
                "License:",
                a({
                    -href => "http://creativecommons.org/licenses/by-sa/3.0/",
                    -rel  => "license",
                }, "CC BY&ndash;SA") . ".",
            )
        ) .
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
        TKD_19_4_2_4 => "earthworm",
        TKD_24_3_1_1 => "Inherently",
        TKD_24_6_2_8 => "accurately",
        TKD_26_2_1_4 => "translation",
        TKD_26_4_3_2 => "conversation",
        TKD_27_4_1_7 => "happening",
        TKD_30_2_1_2 => "combinations",
        TKD_31_2_1_4 => "construction",
        TKD_32_1_1_5 => "monosyllabic",
        TKD_35_1_1_2 => "indicate",
        TKD_36_2_1_5 => "express",
        TKD_37_1_1_3 => "ghuS",
        TKD_39_1_1_2 => "singular",
        TKD_40_2_1_5 => "tenses",
        TKD_41_2_1_4 => "similar",
        TKD_41_3_1_3 => "sentence",
        TKD_58_2_1_5 => "category",
        TKD_63_4_2_8 => "convenience",
        TKD_71_2_1_4 => "superlative",
        TKD_78_2_3_6 => "Occasionally",
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

__END__
