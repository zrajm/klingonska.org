#!/usr/bin/perl
#
# lexicon.cgi - online search engine for zrajm's klingon database
#
# [2001-12-28, 23.29-06.34] V1.0 - Wrote the stuff. Quite primitive, but
# functional. I'll get back to it, but it isn't urgent.
#
# [2002-07-29] V1.1.1 - Messed around slightly. Now calls external footer.
#
# [2003-11-17] V1.1.2 - Some tiny changes.
#
# [2009-04-07] V1.2 - Changed for move to hcoop. All input & output now it
# utf-8. header & footer now internal again.
#
# [2009-05-09] V1.3 - added "use warning" and "use strict" & fixed code that it
# works, fixed '">' input vulnerability, now uses CGI module to generate output
# form (instead of only using it to read the form input)


###############################################################################
##                                                                           ##
##  Initializations                                                          ##
##                                                                           ##
###############################################################################

use warnings;
use strict;
use utf8;
use CGI qw(:standard);                         # use CGI.pm
use Encode 'decode';
binmode(STDIN,  ":encoding(utf8)");
binmode(STDOUT, ":encoding(utf8)");

# output content-type header
# (when used as SSI or loaded explicitly by
# browser, but not when called by other script)
if (not $ENV{X_CGI}) {                         # if not suppressed
    print header(-charset=>'utf-8');           # Content-type header
    $ENV{X_CGI} = "perl";                      #   and suppress it from now on
}                                              #

# language (en=english/sv=swedish)
my $lang = lc ($ENV{LANG} || $ENV{X_LANG});    # get language
$lang = $lang eq "sve" ? "sv" :                #
        $lang eq "eng" ? "en" : $lang;         #
$lang = "en" unless $lang =~ /^(en|sv)$/;      #

our %fieldnames = (
    tlh  => "Klingon",
    sv   => "Swedish",
    en   => "English",
    def  => "Source",
    ref  => "Used in",
    com  => "Comment",
    pun  => "Pun",
    see  => "See also",
    cat  => "Category",
    data => "Data",
);



################################################################################
###                                                                           ##
###  Subroutines                                                              ##
###                                                                           ##
################################################################################

sub print_buffer($@) {
    my $matches = shift;
    foreach (@_) {                             # output result (in this post)
        my ($key, $value) = m/^([^:]+):\s+(.*)/; # field name & cont
        for ($value) {
            s/([<>«»])//g;                # remove <>«»
            s#([{}])# $1 eq "{" ? "<strong lang=\"tlh\">" : "</strong>" #ge;  # boldify
            s#~(.*?)~#<em>$1</em>#g;      # apply italics
            s#(.*)¿\?(.*)#$1$2 (uncertain translation)#g;
        }
        if ($key eq "tlh") {
            print '  <tr><td colspan="3"><hr /></td></tr>' . "\n";
            print '  <tr>'."\n";
            print "    <th>$matches. </th>\n";
            print '    <th class="left">' . "$fieldnames{$key}: </th>\n";
            print "    <td>$value</td>\n";
            print "  </tr>\n";
        } elsif ($key ne "data") {
            print "  <tr class=\"top\">\n";
            print "    <td></td>\n";
            print '    <th class="left">' . "$fieldnames{$key}: </th>\n";
            print "    <td>$value</td>\n";
            print "  </tr>\n";
        }
    }
}

sub in_buffer($@) {
    my $query = shift;                         # get args
    foreach (@_) {                             # search in buffer
        return 1                               # return "success"
            if /$query/o;                      #   if current row contains
    }                                          #   the sought for string
    return 0;                                  # otherwise: "false"
}

sub html_head {
return <<"EOF";
<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en" lang="en">
<head>
<title>Klingon Pocket Dictionary &ndash; Lexicon.</title>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
<meta name="geo.region" content="SE-C" />
<meta name="geo.placename" content="Europe, Sweden, Uppsala, Kåbo" />
<meta name="geo.position" content="59.845658;17.630797" />
<link rel="stylesheet" type="text/css" href="../includes/page.css" />
<link rel="stylesheet" type="text/css" href="../includes/dict.css" />
<link rel="stylesheet" type="text/css" href="../includes/dict-layouttable.css" />
</head>
<body>

<div id="head">
<table class="status">
  <tr>
    <td class="left"><a href="mailto:webmaster\@klingonska.org">webmaster\@klingonska.org</a></td>
<!-- FIXME -->    <td class="center"><a href="http://test.zrajm.org/dict/lexicon.cgi">http://test.zrajm.org/dict/lexicon.cgi</a></td>
<!-- FIXME -->    <td class="right">Updated: 2009&#8209;10&#8209;18, 20:17</td>
  </tr>
</table>

<table class="navigation">
  <tr>
    <td><a href="./">About</a></td>
    <td><a href="intro.html">Introduction</a></td>
    <td><strong>Lexicon</strong></td>
    <td><a href="suffix.html">Suffix Guide</a></td>
    <td><a href="tables.html">Reference Tables</a></td>
  </tr>
</table>

<a href=".."><img src="pic/title.gif" width="400" height="166" alt="tlhIngan Hol mu&rsquo;ghom mach" /></a>

<h1>Klingon Pocket Dictionary: Lexicon</h1>

<p class="note">Some info + searchable version of the pocket dictionary
  database.</p>
</div>

<div id="main">
EOF
}

sub html_form {
    (my $script_name = $0) =~ s#^.*/##;
    return
        start_form({ -method => "get", -action => $script_name }),
        table({ -class => "layout" },
            Tr({ -class => "center" },[
                td([
                    textfield("query", "", 30) . " " . submit("Search"),
                ]),
                td([
                    small(
                        b("Search in:"),
                        radio_group(
                            -name    => "field",
                            -values  => [ "tlh", "en", "sv", "all"],
                            -default => "tlh",
                            -labels  => {
                                tlh => "Klingon",
                                en  => "English",
                                sv  => "Swedish",
                                all => "All data",
                    }))
                ]),
        ])),
        end_form();
}


sub html_foot {
return <<"EOF";
</div>

<div id="foot">
<p class="copyright">©1998&ndash;2010, Copyright <!-- FIXME autogenerate dates -->
<span class="author"><a href="mailto:zrajm\@klingonska.org">Zrajm C Akfohg</a></span>,
<a href="http://klingonska.org/">Klingonska Akademien</a>, Uppsala.</p>
<p class="validator">
  Validate:
  <a href="http://validator.w3.org/check?uri=http://test.zrajm.org/dict/lexicon.cgi">XHTML</a>,
  <a href="http://jigsaw.w3.org/css-validator/validator?uri=http://test.zrajm.org/dict/lexicon.cgi&amp;profile=css3">CSS3</a>,
  <a href="http://validator.w3.org/checklink?uri=http://test.zrajm.org/dict/lexicon.cgi">links</a>.
  License:
  <a href="http://creativecommons.org/licenses/by-sa/3.0/" rel="license">CC BY&ndash;SA</a>.&nbsp;
</p>
</div>
</body>
</html>
EOF
}



###############################################################################
##                                                                           ##
##  Older, non-cleaned up code                                               ##
##                                                                           ##
###############################################################################


$ENV{X_TITLE}   = "Lexicon.";
$ENV{X_YEAR}    = "1998-2003";
$ENV{X_LANG}    = "en";
$ENV{X_THEME}   = "paqHom";
$ENV{X_SUMMARY} = <<"EOF";

    The dictionary parts (Klingon&ndash;English / English&ndash;Klingon) of in the
    <i>Klingon Pocket Dictionary</i> are automatically extracted from a
    database, which has been continuously updated and improved since it was
    created in late 1997. You may use the below form to search that database.

EOF


# read HTML form values
my %form = map {                               # $form{query} & $form{field}
    my $x = param($_);
    $_, (defined($x) ? decode("UTF-8", param($_)) : "");
} qw(query field);                             
my $query       = quotemeta $form{query};      # quote metachars
$form{field} = "tlh" if $form{field} eq "";

print html_head();
print html_form();

for ($form{field}) {
    $query="^tlh:.*?$query",    last if /^tlh$/;  # klingon search
    $query="^en:.*?(?i)$query", last if /^en$/;   # english search
    $query="^sv:.*?(?i)$query", last if /^sv$/;   # swedish search
    $query="^[^:]*:.*?(?i)$query";                # search all fields
}

if ($form{query} ne "") {
    my @buf  = ();                             # clear buffer
    my $matches = 0;                           # clear no of matches
    print '<table class="layout">' . "\n";
    print '<tr><td colspan="3">You searched for' . " »$form{query}« ";
    print "in all $fieldnames{$form{field}} fields.</td></tr>\n";
    open DICT, "<:encoding(utf8)", "dict.zdb";
    while(<DICT>) {                            # skip past data file header
        last if $_ eq "=== start-of-word-list ===\n";
    }                                          #
    # read from the dictionary
    while(<DICT>) {                            #
        last if $_ eq "=== end-of-word-list ===\n"; # done at end-of-dict
        chomp;                                 # remove eol

        # at the beginning of a new post
        # output previous post
        if (s/^(:|\s*$)//) {                   # beginning of new post?
            if (@buf) {                        # format post buffer content
                if (in_buffer($query, @buf)) { #
                    $matches++;                # count matches
                    print_buffer($matches, @buf); # output buffer
                }                              #
                @buf = ();                     #  clear buffer
            }                                  #
            next if /^$/;                      # skip to next line in file
        }                                      #   if this one is empty now

        # when a line is read
        # add it to present buffer
        if ( s/^\s+// ) {                      # if line begins with white space
            $buf[$#buf] .= " ".$_;             #   join it to buffer's last line
        } else {                               # otherwise
            push @buf, $_;                     #   put a new line to buffer
        }                                      #
    }                                          #
    # summary at end of found page
    if ($matches == 0) {
        print "  <tr><td colspan=\"3\"><hr /></td></tr>\n";
        print "  <tr><td colspan=\"3\">There were no matches.</td></tr>\n";
    }
    close DICT;
    print "  <tr><td colspan=\"3\"><hr /></td></tr>\n";
    print "  <tr><td colspan=\"3\">$matches match" . ($matches==1 ? "" : "es") . ".</td></tr>\n";
    print "</table>\n";
} else {
print <<"EOF";

<p>The book has both a Klingon&ndash;English, and an English&ndash;Klingon
wordlist. These wordlists are automatically extracted from a simple database,
which is very easy to update. This database has been continuously updated and
improved since it was created in late 1997.</p>

<p>The form above gives you access to a very crude search engine for searching
the database material. In the end I hope to provide the same search
functionality here as in the <i><a href="../canon/">Archive of Okrandian
Canon</a></i> but for the moment, this will have to do.</p>

<p><strong>Instructions:</strong> You may type any word or part of a word to
search for, the engine is totally ignorant about to different kinds of
characters, and treat spaces like any other character. The engine is case
insensetive, except if you make searches using »Klingon«. Note, however, that
searches made using »All data« are always case insensetive, even when it comes
to words in Klingon.</p>

EOF
}

print html_foot();

#[eof]
