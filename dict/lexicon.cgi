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
#
# [2010-08-21] v1.4 - major rewrite; implemented search prefixes a la Google to
# search different fields, and removed old radio button (radio button affected
# all of search, prefixes can be defined individually for each word or phrase
# in the query); implemented "..." to search for entire phrases, and glob "*"
# which matches any part of a word, also made handling of spaces somewhat
# smarter (though, for good or bad, a space in a phrase will not match over
# punctuation marks); added randomized search tips to help user


###############################################################################
##                                                                           ##
##  Initializations                                                          ##
##                                                                           ##
###############################################################################

use warnings;
use strict;
use utf8;
use CGI qw(:standard);
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

our %postprocess = (
    file => sub {
        my ($value) = @_;
        my $i = 0;
        return map {
            $value !~ /-(tkd|tkw|kgt)\.txt$/
                ? ($i++ ? "\n      <br />" : "") . "<a href=\"../canon/$_\">$_</a>"
                : ();
        } split(/;\s*/, $value);
        #return undef if $value =~ /-(tkd|tkw|kgt)\.txt$/;
        #return '<a href="../canon/' . $value . '">' . $value . '</a>';
        #undef;
    },
);
our %field = (
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
    file => "Transcript",
);

our @tips = (
    "Example: <strong>def:HQ10:4</strong> lists all words first occuring in <strong lang=\"tlh\">HolQed</strong> issue 10:4.",
    "Prefixes: <strong>tlh:</strong> = Klingon, <strong>en:</strong> = English, <strong>sv:</strong> = Swedish",
    "Prefixes: <strong>com:</strong> = comment, <strong>def:</strong> = defining source, " .
        "<strong>ref:</strong> = source",
    "Example: <strong>tlh:*'egh</strong> finds all Klingon words ending in <em>&rsquo;egh</em>",
    "Example: <strong>data:klcp</strong> lists all Klingon Language Certification Program words.",
    "Example: <strong>def:kgt</strong> lists all words first occuring in KGT.",
    "Put <strong>tlh:</strong> before a word to search in Klingon definitions.",
    "Put <strong>sv:</strong> before a word to search in Swedish definitions.",
    "Put <strong>en:</strong> before a word to search in English definitions.",
    "Use <strong>*</strong> to mean any sequence of letters.",
    "Use <strong>\"...\"</strong> to search for a phrase.",
);


################################################################################
###                                                                           ##
###  Subroutines                                                              ##
###                                                                           ##
################################################################################

sub read_dictionary {
    my ($file) = @_;
    open(my $fh, "<:encoding(utf8)", $file) or
        die "cannot open dictionary file '$file'";
    # skip file header
    while (<$fh>) {
        last if $_ eq "=== start-of-word-list ===\n";
    }
    # read dictionary
    my @buf = ();
    while (<$fh>) {
        # terminate at file footer
        last if $_ eq "=== end-of-word-list ===\n";
        chomp();
        # beginning of a new post
        if (s/^(:|\s*$)//) {                  # beginning of new post?
            push(@buf, "");
            next if /^$/;                         # skip to next line in file
        }                                         #   if this one is empty now

        # indented line, or new field
        if ( s/^\s+// ) {                      # if line begins with white space
            $buf[$#buf] .= " " . $_;           #   join it to buffer's last line
        } else {                               # otherwise
            $buf[$#buf] .= "\n" . $_;          #   add new line to buffer
        }
    }
    close($fh);
    return map { s/[<>«»]//g; $_ } @buf;
}


# Usage: @REGEX = split_query($QUERY);
#
# Takes a QUERY and splits it into phrases (a phrase is a word or a double
# quoted string).
#
# Returs a list of regexes for matching that query. A phrase may start with a
# field name (e.g. 'tlh:') to match only that field. If a phrase is quoted then
# the field name must occur before the quotes, i.e. 'tlh:"hej"' is interpreted
# the same as 'tlh:hej' (search field "tlh" for string "hej"), while
# '"tlh:hej"' is interpreted literally (search any field for string "tlh:hej").
#
# TODO: implement negative queries?
sub split_query {
    my ($query) = @_;
    # split query into words and quoted strings
    my @subquery = $query =~ m/( [^\s"]+(?:"[^"]+"?)? | "[^"]+"? )/xg;
    # turn subqueries into regexes
    for (@subquery) {
        # split subquery into field name & search phrase
        my ($field, $phrase) = /^ (?:([^":]*):)? "?(.*?)"? $/x;
        # quote metacharacters + "any field" if field was empty
        $field  = defined($field) ? quotemeta(lc($field)) : "[^:]*";
        $phrase = quotemeta($phrase);
        # all fields are case-insensetive, except "tlh"
        if ($field eq "tlh") {
            my $w = "[\\w']";  # word character class
            # replace asterisks and spaces
            for ($phrase) { s/\\\*/$w*/g; s/\s+/\\s+/g; }
            $_ = qr/($field:.*)(?<!$w)($phrase)(?!$w)/;
        } else {
            my $w = "[\\w]";  # word character class
            # replace asterisks and spaces
            for ($phrase) { s/\\\*/$w*/g; s/\s+/\\s+/g; }
            $_ = qr/($field:.*)(?<!$w)($phrase)(?!$w)/i;
        }
    }
    return @subquery;
}

sub html_no_match {
    my ($query) = @_;
return <<"EOF";
<p>Your search &ndash; <strong>$query</strong> &ndash; did not match any
dictionary entries.</p>

<p>Suggestions:</p>

<p>
  <ul>
    <li>Make sure all words are spelled correctly.</li>
    <li>Try different keywords.</li>
    <li>Try more general keywords.</li>
  </ul>
</p>

EOF
}

sub html_empty_page {
return <<"EOF";

<p>The book has both a Klingon&ndash;English, and an English&ndash;Klingon
wordlist. These wordlists are automatically extracted from a simple text-based
database, which is very easy to update. This database has been continuously
updated and improved since it was created in late 1997. The word database can
be downloaded via the <a href="../canon/download.cgi">Klingon Data Download
page</a>.</p>

<table class="layout">
  <tr>
    <th colspan="2">Search Expressions</th>
  </tr>
  <tr>
    <td class="center"><strong>"</strong>...<strong>"</strong>&nbsp;</td>
    <td>search for a phrase (containing more than one word)</td>
  </tr>
  <tr>
    <td class="center"><strong>*</strong>&nbsp;</td>
    <td>matches any alphabetical character</td>
  </tr>
  <tr>
    <td class="center"><strong>tlh:</strong>...&nbsp;</td>
    <td>search Klingon definitions (case sensetive!)</td>
  </tr>
  <tr>
    <td class="center"><strong>en:</strong>...&nbsp;</td>
    <td>search English definitions</td>
  </tr>
  <tr>
    <td class="center"><strong>sv:</strong>...&nbsp;</td>
    <td>search Swedish definitions</td>
  </tr>
  <tr>
    <td class="center"><strong>def:</strong>...&nbsp;</td>
    <td>search defining source references</td>
  </tr>
  <tr>
    <td class="center"><strong>ref:</strong>...&nbsp;</td>
    <td>search non-defining source references</td>
  </tr>
</table>

<p>A search word that is not preceeded by a colon prefix will look through all
data case-insensitively &ndash; even the Klingon data. Thus
<strong>hej</strong> will find the Klingon word for &ldquo;rob&rdquo;, while
<strong>tlh:hej</strong> does case-sensetive search and find nothing at
all.</p>

EOF
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
<style><!--
  .match {
    background-color: #bbbbbb;
  }
--></style>
</head>
<body>

<div id="head">
<table class="status">
  <tr>
    <td class="left"><a href="mailto:webmaster\@klingonska.org">webmaster\@klingonska.org</a></td>
<!-- FIXME -->    <td class="center"><a href="http://klingonska.org/dict/lexicon.cgi">http://klingonska.org/dict/lexicon.cgi</a></td>
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

<p class="note">Some info + searchable version of the pocket dictionary database.</p>
</div>

<div id="main">
EOF
}

sub html_form {
    my ($query) = (@_, "");
    $query = escapeHTML($query);
    (my $script_name = $0) =~ s#^.*/##;
    my $tips = $tips[int(rand(@tips))];
    return <<"EOF";

<table class="layout">
  <tr class="center">
    <td>
      <form method="get" action="lexicon.cgi">
        <input type="text" name="q" value="$query" size="30"
          autofocus="autofocus" placeholder="Words to search for"
          /><input type="submit" value="Search" />
      </form>
    </td>
  </tr>
  <tr class="center">
    <td><small>$tips</small></td>
  </tr>
</table>

EOF
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
  <a href="http://validator.w3.org/check?uri=http://klingonska.org/dict/lexicon.cgi">XHTML</a>,
  <a href="http://jigsaw.w3.org/css-validator/validator?uri=http://klingonska.org/dict/lexicon.cgi&amp;profile=css3">CSS3</a>,
  <a href="http://validator.w3.org/checklink?uri=http://klingonska.org/dict/lexicon.cgi">links</a>.
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
##  Main Program                                                             ##
##                                                                           ##
###############################################################################

# no query: display empty search form & exit
if (not param("q")) {
    print
        html_head() .
        html_form() .
        html_empty_page() .
        html_foot();
    exit 0;
}

# read query from HTML form value
my $query = param("q");             # read form "q" value
$query = "" unless defined($query); # make sure it's never undef
$query = decode("UTF-8", $query);   # UTF-8 decode it

print html_head() . html_form($query);
{
    # make list of page content
    my @regex = split_query($query);
    my @output  = ();
    my $matches = 0;
  WORD: foreach (read_dictionary("dict.zdb")) {
        # highlight matching words
        foreach my $regex (@regex) {
            s/^$regex/$1<span class="match">$2<\/span>/m or next WORD;
        }
        push @output, '  <tr><td colspan="2">&nbsp;</td></tr>' . "\n"
            if $matches > 0;
        $matches ++;
        # presentation
        s#([{}])# $1 eq "{" ? "<strong lang=\"tlh\">" : "</strong>" #ge;  # boldify
        s#~(.*?)~#<em>$1</em>#g;      # apply italics
        s#(.*)¿\?(.*)#$1$2 (uncertain translation)#g;
        s/^\n//;
        foreach (split(/\n/, $_)) {
            my ($field, @content) = split(/:/, $_, 2);
            s/^\s+//, s/\s+$// foreach @content;
            if (exists($postprocess{$field})) {
                @content = &{$postprocess{$field}}(@content);
                next unless @content;
            }
            push @output, "  <tr>\n";
            push @output, "    <td>" . (exists($field{$field}) ? $field{$field} : ucfirst($field)) . ":&nbsp;</td>\n";
            push @output, "    <td>@content</td>\n";
            push @output, "  </tr>";
        }
    }
    # output page
    if ($matches == 0) {
        print html_no_match($query);
    } else {
        print '<table class="layout">' . "\n";
        print '  <tr><td colspan="2">' . $matches . ' match' . ($matches == 1 ? "" : "es") . ".</td></tr>\n";
        print '  <tr><td colspan="2">&nbsp;</td></tr>' . "\n";
        print @output;
        print "</table>\n\n";
    }
}
print html_foot();

#[eof]
