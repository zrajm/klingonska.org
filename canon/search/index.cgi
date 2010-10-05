#!/usr/bin/perl

# TODO
#
#     o word index for fast searches
#
#     o taint checks
#
#     o cleanup of code/data, place HTML last(?)
#
#     o perhaps one could count in how many files each respective word in a
#       search exists (multiple occurances counted as end). This would help if
#       you get a a word which occurs to often to be able to display it (max= in
#       more than 30 different öl!)
#
#     o show page numbers in search results preview (where applicable)
#
#     o logging(?)
#
#     o TKD/TKW/KGT displayable -- with proof of ownership (use cookie)
#
#     o test well-formedness of stylesheet + HTML
#

# HISTORY
#
# [2001-10-08, 21:41] - [2001-10-10, 07.50] 0.1b
#
# [2001-10-12, 05.29-09.19] 0.2b
#
# [2001-10-16, 13:43-15:17] 0.3b
#
# [2001-10-17, 18.45-22.09] v0.4b - At last fixed the bug that caused some
# searches not to be correctly marked in the search output.
#
# [2001-10-20,~03.00] - v0.4b now automatically enables beta test mode if the
# script is called 'found.cgi' (that's just to help me developing it).
#
# [2002-10-24, 16.19-17.03] - Just fooled around a bit. This code need serious
# rewriting.
#
# [2009-04-13]
#
# [2010-03-03]
#     o search at top of page doesn't work when displaying a file
#     o focus text input on page load (javascript?)
#     o proper scoping of all variables fixed
#

# Implementera vettig standardheader för filformatet.
#
# $query            = original query (string)
# $query_clean      = query as it was interpreted
# @query_regex[$i]  = the one used to grep through files, of i length
#   @query_word[$i] = the words of the query (un-regexed)
#   @query_not [$i] = true when $query_regex[$i] shouldn't match
#   @query_case[$i] = true when $query_regex[$i] is case sensetive
# $query_mark       = single regex for marking matches in output
#

use strict;
use warnings;
use utf8;
use CGI qw(:standard);
binmode(STDIN,  ":encoding(utf8)");
binmode(STDOUT, ":encoding(utf8)");

{
    package Query;
    # $query            = original query (string)
    # $query_clean      = query as it was interpreted
    # @query_regex[$i]  = the one used to grep through files, of i length
    #   @query_word[$i] = the words of the query (un-regexed)
    #   @query_not [$i] = true when $query_regex[$i] shouldn't match
    #   @query_case[$i] = true when $query_regex[$i] is case sensetive
    # $query_mark       = single regex for marking matches in output

    # this thing splits a string into words if a "word" contains spaces it
    # should be quoted generate: four lists @query_{word,not,case,regex}[] and
    # the strings $query_mark (a regex for marking found things) and
    # $query_clean (a cleaned up version of the query - as interpreted by the
    # program).

    # returns the number of substings in the query
    sub new {
	my ($package, $string) = @_;
	my $self = bless({
	    original => $string,
	    case     => [],
	    clean    => "",
	    error    => "",
	    mark     => qr//,
	    not      => [],
	    regex    => [],
	    word     => [],
	}, $package);
	{
	    my (@case, @clean, @mark, @not, @regex, @word) = ();
	    my $not_count = 0;
	    for (split_query($string)) {
		next if /^[-+=]*[ *]*$/; # skip wildcard-only words
		my ($prefix, $word) = m#^([-+=]*)"?([^"]*)#;    # extract prefix & del quotes
		$word =~ s/([ *])\1*/$1/g;                       # compress multiple stars/spaces
		my $not   = ($prefix =~ m/-/ ? "-" : "");
		my $case  = ($prefix =~ m/=/ ? "=" : "");
		my $regex = regexify($word, $case);
		push @case,  $case;                  # ignore case prefix
		push @clean, $not . $case .          # cleaned-up version of query
		    ($word =~ m/(?:^[-+=]|\s)/ ? '"'.$word.'"' : $word);
		if ($not) {
		    $not_count ++;
		} else {
		    push @mark,  $regex;             # text highlight regex
		}
		push @not,   $not;                   # negation prefix
		push @regex, $regex;                 # word -> regex
		push @word,  $word;                  # word (excluding) prefix
	    }
	    my $regex = "(".join("|", @mark).")";
	    $self->{case}  = \@case;
	    $self->{clean} = join(" ", @clean);
	    $self->{mark}  = qr/$regex/;
	    $self->{not}   = \@not;
	    $self->{regex} = \@regex;
	    $self->{word}  = \@word;
	    $self->{error} = "You may not negate all search words"
		if $not_count == @word;
	}
	return $self;
    }

    sub case {
	my ($self) = @_;
	return @{$self->{case}};
    }

    sub clean {
	my ($self) = @_;
	return $self->{clean};
    }

    sub error {
	my ($self) = @_;
	return $self->{error};
    }

    sub mark {
	my ($self) = @_;
	return $self->{mark};
    }

    sub not {
	my ($self) = @_;
	return @{$self->{not}};
    }

    sub regex {
	my ($self) = @_;
	return @{$self->{regex}};
    }

    sub word {
	my ($self) = @_;
	return @{$self->{word}};
    }

    sub regexify {
	my ($string, $case) = @_;
	my $alph = "'0-9A-Za-z".               # alphabetical characters
	    "ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞß". #   (note that apostrophe
	    "àáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ"; #   is included)
	$string = quotemeta($string);          # no metacharacters
	foreach ($string) {
	    s#\\\*#[$alph]*#g;                 # asterisk wildcard
	    s#\\\ #[^$alph]+#g;                # space wildcard
	};
	return $case ? qr/$string/ : qr/$string/i;
    }

    # split query string into substrings
    sub split_query {
	my ($string) = @_;
	return grep {                      # split string into list
	    defined($_) and $_ ne "";      #   of quoted or unquoted words
	} split m#(?: *([-+=]*"[^"]*"?) *| +)#, $string;
    }

    1;
}


###############################################################################
##                                                                           ##
##  Settings                                                                 ##
##                                                                           ##
###############################################################################

sub FALSE { "" }
sub TRUE  {  1 }
our %cfg = (
    VERSION        => "BETA 0.8b",
    MAX_MATCHES    => 30,                      # max allowed number of hits
    DESC_LENGTH    => 300,                     # max length of file descr.
    # context length is always shortened, so this is only an approximate value
    # (it can never grow bigger than this though)
    CONTEXT_LENGTH => 35,                      # max length of found context
    SCRIPT_URL     => "",                 #$ENV{"SCRIPT_NAME"} =~ m#([^/]+)$#;
    BASE_DIR       => "..",

    # things for regexes
    re_alph => "'0-9A-Za-z".                       # alphabetical characters
        "ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞß".         #   (note that apostrophe
        "àáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ",         #   is included)

    # unit test stuff
    TEST => {
	html2transcript => FALSE,
    }
);
# word boundaries for regexes
$cfg{re_bow} = "(?:\\A|(?<![$cfg{re_alph}]))";     # beginning of word
$cfg{re_eow} = "(?:\\Z|(?![$cfg{re_alph}]))";      # end of word


$ENV{"X_YEAR"}  = "2002";                      # year
$ENV{"X_LANG"}  = "en";                        # language
$ENV{"X_NOLOG"} = "YES";                       # turn of logging
$ENV{"X_TITLE"} = "Okrandian Canon Search ($cfg{VERSION})";# page title

# FIXME: check these variables (bad names?)
my $path = ""; #"$ENV{DOCUMENT_ROOT}";               # path


###############################################################################
##                                                                           ##
##  Functions                                                                ##
##                                                                           ##
###############################################################################


sub dump {
    use Data::Dumper;
    $Data::Dumper::Sortkeys = 1;
    $Data::Dumper::Indent   = 1;
    print "<pre>", Dumper(@_), "</pre>";
}

# Returns file modification time of this script.
sub script_date {
    my @time = localtime((stat $0)[9]);            # file modification date
    return sprintf "%04u-%02u-%02u, %02u.%02u",    #   YYYY-MM-DD, HH.MM
	1900+$time[5], 1+$time[4], @time[3,2,1];   #   year, month, day, hour, min
}

# Returns url of this script.
# FIXME taint checks
sub script_url {
    my $url = "http://" . env("SERVER_NAME") . env("REQUEST_URI");
    $url =~ s/\?.*$//;  #   chop off any "get" args
    return $url;
}

sub env {
    my ($envname) = @_;
    return exists($ENV{$envname}) ? $ENV{$envname} : "";
}


sub developer_query_dump(\@\@\@\@$) {
    my @query_word  = @{shift()};
    my @query_not   = @{shift()};
    my @query_case  = @{shift()};
    my @query_regex = @{shift()};
    my $query_mark  = shift();

    # developer info (dump word, rexes etc.)
    print "<table cellspacing=\"0\" border=\"1\" align=\"center\">\n";
    print "  <tr>\n";
    print "    <th colspan=\"2\">word</th>\n";
    print "    <th>regex</th>\n";
    print "  </tr>\n";
    for my $i (0..$#query_word) {
        print "  <tr".($query_not[$i]?" bgcolor=\"grey\"":"").">\n";
        print "    <td>$query_not[$i]$query_case[$i]</td>";
        print "    <td>$query_word[$i]</td>\n";
        my $x = $query_regex[$i];               # shorten long regexes
        $x =~ s#$cfg{re_alph}#[:alph:]#go;              # involving $cfg{re_alph}
        print "    <td>$x</td>\n";
        print "  </tr>\n";
    }
    print "  <tr>\n";
    print "    <th colspan=\"3\">mark regex</th>\n";
    print "  </tr>\n";
    print "  <tr>\n";
    my $x = $query_mark;               # shorten long regexes
    $x =~ s#$cfg{re_alph}#[:alph:]#go;              # involving $cfg{re_alph}
    print "    <td colspan=\"3\">$x</td>\n";
    print "  </tr>\n";
    print "</table> \n";
}


# Usage: ($TEXT[, %HEAD]) = read_file($FILE);
#
# In list context reads & parses $FILE, returning $TEXT [[...]] header data in
# %HEAD.
#
# In scalar context $FILE is returned as-is, any header is unparsed and included
# in $TEXT.
#
# $FILE is a plain text file, or KA transcript file with leading [[...]] header
# containing metadata (such as author, date, publisher etc.).
sub read_file {
    my ($file) = @_;
    # FIXME add error messages on error (for open/read/close)
    # or if file not found
    open(my $fh, "<:encoding(utf8)", $file) or return ();
    my $text = join("", <$fh>);     # read 1st line

    # read header (if any)
    if (wantarray) {
	my %head  = ();
	if ($text =~ s# \A \Q[[\E (.*?) ^\Q]]\E ##msx) {
	    my $head = $1;
	    while ($head =~ m/\n ([\t ]*) (\w+): [\t ]* ((?: [^\n]|\n\1[\t ]+)*) /gx) {
		my ($name, $content) = (lc $2, $3);
		$content =~ s/\n[\t ]+/ /g;
		$head{$name} = $content;
	    }
	}
	return ($text, %head);
    }
    return $text;
}


sub page_footer {
    return <<EOF;
</div>

<div id="foot">
<p class="copyright">&copy;1998&ndash;2010, Copyright <span class="author"><a href="mailto:zrajm\@klingonska.org">Zrajm C Akfohg</a></span>, <a href="http://klingonska.org/">Klingonska Akademien</a>, Uppsala.</p>
<p class="validator">
 Validate:
  <a href="http://validator.w3.org/check?uri=http://test.zrajm.org/canon/">XHTML</a>,
  <a href="http://jigsaw.w3.org/css-validator/validator?uri=http://test.zrajm.org/canon/&amp;profile=css3">CSS3</a>,
  <a href="http://validator.w3.org/checklink?uri=http://test.zrajm.org/canon/">links</a>.
 License:
  <a href="http://creativecommons.org/licenses/by-sa/3.0/" rel="license">CC BY&ndash;SA</a>.&nbsp;
</p>
</div>
</body>
</html>
EOF
}


sub page_header {
    my (%hash) = @_;
    my $changed = script_date();
    my $url     = script_url();
    my ($javascript, $headline, $big_logo) = ("", "", "");
    if (exists($hash{title}) and $hash{title}) {
	$headline = <<EOF;
<h1>$ENV{X_TITLE}</h1>
EOF
	$big_logo = <<EOF;
<p><a href=".."><img src="../../pic/ka.gif" width="600" height="176" alt="Klingonska Akademien" /></a></p>
EOF
	$javascript = <<EOF;
<script type="text/javascript"><!--
  function formfocus() {
    document.getElementById('query').focus();
  }
  window.onload = formfocus;
--></script>
EOF
    }
    return <<EOF;
<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en" lang="en">
<head>
<title>$ENV{X_TITLE} (Klingonska Akademien)</title>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
<meta name="geo.region" content="SE-C" />
<meta name="geo.placename" content="Europe, Sweden, Uppsala, Kåbo" />
<meta name="geo.position" content="59.845658;17.630797" />
<link rel="stylesheet" type="text/css" href="../../includes/page.css" />
<link rel="stylesheet" type="text/css" href="../../includes/dict-layouttable.css" />
$javascript</head>
<body>

<div id="head">
<table class="status">
  <tr>
    <td class="left"><a href="mailto:webmaster\@klingonska.org">webmaster\@klingonska.org</a></td>
    <td class="center"><a href="$url">$url</a></td>
    <td class="right">$changed</td>
  </tr>
</table>
$big_logo</div>

<div id="main">$headline
EOF
}


sub page_title {
    return <<EOF;

<!-- ==================== Title ==================== -->
<p align="center"><a href=".."><img src="/pic/ka.gif" width="600" height="176" alt="Klingonska Akademien" border="0" vspace="5" /></a>

<h1 align="center">$ENV{X_TITLE}</h1>
EOF
}


# Resolve hypenation and remove comments from a transcript.
sub strip_comments {
    my ($text) = @_;
    for ($text) {
        s/(?<=[$cfg{re_alph}])- *\Q[[keep hyphen]]\E\n/-/g; # keep hyphen
        s/(?<=[$cfg{re_alph}])-\n//g;          # remove hypenation
        s/(?<=--)\n//g;                        # keep en-dashes
	s# *\Q[[\E.*?\Q]]\E##g;                # remove comments [[...]]
    }
    return $text;
}

sub display_result {
    my ($path, %form) = @_;
    my $query = new Query($form{query});
    print old_form($query->clean(), "", %form);      # output page header & form
    if ($form{debug}) {
	# TODO compare structures & fix them up
	# (sort output from Dumper)
	{
	    my @query_word  = $query->word();
	    my @query_not   = $query->not();
	    my @query_case  = $query->case();
	    my @query_regex = $query->regex();
	    my $query_mark  = $query->mark();
	    developer_query_dump(
		@query_word, @query_not, @query_case,
		@query_regex, $query_mark);        #   show query from string
	}
    } else {                                   #
        #log_query();                           #   log the search
    }                                          #
    # file name globbing
    my @file    = sort glob("$cfg{BASE_DIR}/[0-9]*.txt");  # glob up a file name list
    my $matches = 0;                           # number of matches found
    my $output  = "";                          # output buffer
    if ($query->error()) {
        $output  = "<h2>" . $query->error() . ".</h2>\n\n";
        $output .= suggest_search();     #
    } else {                                    # not all words are negated
	$output .= "<dl>";
	my @query_regex = $query->regex();
	my @query_not   = $query->not();
	my $query_mark  = $query->mark();
      FILE: foreach my $file (@file) {        #   for each file
	    # read file
	    my ($text, %head) = read_file($file);
	    $text = strip_comments($text);
	    foreach my $j (0..$#query_regex) {
		if ($text =~ /$cfg{re_bow}$query_regex[$j]$cfg{re_eow}/ xor $query_not[$j]) {
		    $matches++;
		    $output .= store_match($file, $text, $form{query}, $query_mark, %head);
		}
	    }
        }
	$output .= "</dl>";
        # override search result (if too many, or none at all)
        #if ($matches == 0) {
	#    $output = no_matches($matches) . suggest_search();
        #} elsif ($matches > $cfg{MAX_MATCHES}) {
        #    $output = too_many_matches($matches);
        #}
    }
    print display_matches($matches, $query->clean());
    print $output;
    print page_footer();
}


our %month = (
    "01" => "Jan", "02" => "Feb", "03" => "Mar", "04" => "Apr", "05" => "May",
    "06" => "Jun", "07" => "Jul", "08" => "Aug", "09" => "Sep", "10" => "Oct",
    "11" => "Nov", "12" => "Dec",
);

sub store_match {
    my ($file, $text, $query, $query_mark, %head) = @_;
    # $text is the contents if $file, with comments and hyphenation removed and
    # without the file header

    # extract date
    my $date = do {
	my ($year, $month, $day) = $file =~ m#^ (?:.*/)? (\d+) (?: -(\d+) (?:-(\d+))? )? \w?--#x;
	$month =  $month{$month} if defined($month);
	$day   =~ s/^0+//        if defined($day);
	"$day $month $year";
    };

    # FIXME: we should display matches of TKD, CK, PK the other canon works
    # differently, so that page numbers are shown for each match
    my ($title, $link, $source_link) = file2title($file, $query);   # get name of document

    $title = transcript2html($head{title}) if exists($head{title});

    my $output_buffer =
        "  <dt><b><a href=\"$link\">$title</a></b></dt>\n" .   # FIXME
        "  <dd><font size=\"-1\"><font color=\"#777777\"><i>" .
	join(" - ",
	     $date,                                                  # publish date
	     (exists($head{type})      ? ucfirst($head{type}) : ()), # type (book, email etc.)
	     (exists($head{author})    ? $head{author}        : ()), # author
	     (exists($head{publisher}) ? $head{publisher}     : ()), # author
	) . "<i></font>\n" .
	"    <br />";

    my $characters = 0;
    my $context = "";
    # FIXME: This while loop should probably be re-written to use as many *different*
    # matching words as possible. Instead of just outputting the x number of matches
    # that comes first in each file. A loop over (parts of) $query_regex[$i] could
    # prove fruitful.
    my $incomplete = "";
    while (
        $characters < $cfg{DESC_LENGTH}
        and $text =~ /$cfg{re_bow}$query_mark$cfg{re_eow}/gx
    ) {
#        $foundpos = pos($text);
        ($context, $incomplete) = context(      # get context of found word
            $text,                              #
            pos($text)-length($1)-$cfg{CONTEXT_LENGTH}, # left pos in string
            $cfg{CONTEXT_LENGTH}*2+length($1)        # size of pre- & post-context
        );

        $context =~ s#\n+(?:[>:] *)*# #g;                 # TODO: remove or keep?
                                                          # this thingy removes the line
                                                          # quote signs ":" and ">"

        $context =~ s#\A  [$cfg{re_alph}]* [^$cfg{re_alph}]+   ##sox      # trim initial half-word & space
            unless $incomplete<0;                         #
        $context =~ s#   [^$cfg{re_alph}]+  [$cfg{re_alph}]* \Z##sox      # trim final space & half-word
            unless $incomplete>0;                         #

#        # break contexts at new paragraph or between words
#        $left_context   =~ s#(?:.*(?:\n[\t  ]*  ){2,}  |\A [$cfg{re_alph}]*[^$cfg{re_alph}]+  )##sox
#            if $lbeg;
#        $right_context  =~ s#(?:  (?:  [\t  ]*\n){2,}.*|  [^$cfg{re_alph}]+ [$cfg{re_alph}]*\Z)##sox
#            if length($right_context) == $cfg{CONTEXT_LENGTH};

        $context     =~ s/\n+/ /g;              # linefeed = space
        $characters +=  length $context;        # size of match description

        # mark found word(s) (by inserting [[...]] around it - it is ok to use the
        # comment symbols, because we've already removed all the comments in the
        # text and we need something here that both is unaffected by the HTML encoding
        # and guaranteed not to occur in the text naturally
        $context     =~ s#$cfg{re_bow}($query_mark)$cfg{re_eow}#[[$1]]#g;
        $context     =  transcript2html($context);  # htmlify description

        # convert the found word marks (i.e. [[...]]) into HTML tags
        $context     =~ s#\Q[[\E#<font color="\#FF0000"><b>#go;
        $context     =~ s#\Q]]\E#</b></font>#go;#

        $output_buffer .= ($incomplete >= 0 ? "<b>...</b>\n      " : "").
#            " ".($linked?"":"[$page****]").     # this should add the page number
            " $context";
    }                                           #
    $output_buffer .= ($incomplete <= 0 ? " <b>...</b>" : "") . "\n" .
	($source_link ? "    <br /><font color=\"#777777\"><a href=\"$source_link\">Transcript</a>" : "") .
	"</font></font></dd>\n\n";
    return $output_buffer;
}

sub old_form {
    my ($query_clean, $message, %form) = @_;
    # "Clean Up Query" link
    my $clean_link = "";
    unless ($query_clean eq $form{query}) {     # is query string messy?
        $clean_link = "\n      <br />&nbsp;" .  #   create "clean up" link
            "<a href=\"$cfg{SCRIPT_URL}?query=".#   to add in form
            url_encode($query_clean) .          #
            "\">Clean Up Query</a>";            #
    }
    my $output .= page_header() . xx($clean_link, $message, %form);
    return $output;
}

sub xx {
    my ($clean_link, $message, %form) = @_;
    my $file_arg = "\n".'<input type="hidden" name="file" value="' . html_encode($form{file}) . '" />'
            if $form{file};
    $message = "\n      ".'<tr><td align="center"><small>' . $message . "</small></td></tr>" if $message;
    my $backlink = $form{query} ? "?query=$form{query}" : "..";
return <<EOF;
<p><form action="$cfg{SCRIPT_URL}" method="get">$file_arg
<table class="layout">
  <tr>
    <td rowspan="2" align="center"><a href="$backlink"><img src="../../pic/kabutton.gif" width="92" height="82" alt="Klingonska Akdemien" border="0" /></a></td>
    <td><h2>$ENV{X_TITLE}</h2></td>
  </tr>
  <tr><td>
    <table class="layout">$message
      <tr class="middle">
        <td><input type="text" id="query" name="query" value="${\&html_encode($form{query})}" size="35"
          /><input type="submit" value="Search" /></td>
        <td><small>&nbsp;<a href="$cfg{SCRIPT_URL}?get=help">Search Help</a>$clean_link</small></td>
      </tr>
    </table>
  </td></tr>
</table>
</form>
EOF
}

sub empty_form {
    my (%form) = @_;
print <<"EOF";
<center>
<form action="$cfg{SCRIPT_URL}" method="get">
<table cellspacing="0" cellpadding="0" border="0">
  <tr valign="middle">
    <td>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</td>
    <td><input type="text" id="query" name="query" value="" size="30" /></td>
    <td>&nbsp;</td>
    <td><input type="submit" value="Search" /></td>
    <td>&nbsp;</td>
    <td><font size="1"><a href="$cfg{SCRIPT_URL}?get=help">Search Help</a></font></td>
  </tr>
</table>
</form>
</center>
EOF
}


sub new_form {
    print page_header(title => TRUE);                         # page header
    empty_form();
    print <<EOF;                                 # empty form
<p class="center"><b>Modifiers:</b> &ldquo;=&rdquo; = case sensetive / &ldquo;-&rdquo; = negative search
<br /><b>Wildcards:</b> &ldquo;*&rdquo; = alphanumeric / space = other (only in phrases)</p>
EOF
    print page_footer();                        # page footer
}

sub help_page {
    print page_header(title => TRUE);                         # page header
    empty_form();
    print <<EOF;

<h2>Help on Searching</h2>


<!-- FIXME: Find a better example phrase to use in the table
below. I.e. one that does not begin or end in an apostrophe (since
this looks nasty in combination with the quotes) and that contains at
least one word that is homographic with a word in English when
searched for case-insensetively. -->

<!--
<table border="2" cellspacing="0" cellpadding="5" width="90%" align="center">
<tr valign="top">
  <th>taHjaj wo\'</th>
  <td>Will find all documents that contain both the word »<tt>wo\'</tt>« and
  the word »<tt>tahjaj</tt>«. The order and placement of the words in
  the document is not important, notice, however, that the search is
  case-insensetive (which is probably not something you want if
  you\'re searching for a word in Klingon).
</tr>
<tr valign="top">
  <th>"taHjaj wo\'"</th>
  <td>This will find any occurance of the phrase »<tt>tahjaj wo\'</tt>«
  (i.e. the words must occur in the same order you wrote them, and
  there may not be any other words between them). All non-alphabetical
  characters (e.g. puntuaction marks) in the document are ignored so
  this query would match a document containing the string »<tt>TAHJAJ,
  WO\'</tt>«.</td>
</tr>
<tr valign="top">
  <th>.taHjaj wo\'</th>
  <td>This query matches any document that contains both the given
  words, however search for the word »taHjaj« is case-sensetive so it
  must be exactly matched (a wise thing if you\'re searching for a
  word in Klingon).</td>
</tr>
<tr valign="top">
  <th>taHjaj -wo\'</th>
  <td>This would match any document that contains the word
  »<tt>taHjaj</tt>«, but not the word »<tt>wo\'</tt>«.</td>
</tr>
<tr valign="top">
  <th>taH* wo\'</th>
  <td>Matches any document that contains the word »<tt>wo\'</tt>« and a
  word that begins with »<tt>tah</tt>«. The asterisk matches any
  number of alphabetical characters (including apostrophe) and may be
  used anywhere in a word or phrase. (Any search word consisting of
  only an asterisk is ignored, however.)</td>
</tr>
</table>

<p align="center"><b>Special chars:</b>  = ; - (minus) = exclude word from search; * (asterisk) = match
any number of letters, numbers or aphostrophes.
-->

<table border="2" cellspacing="0" cellpadding="5" xwidth="90%" align="center">
<tr valign="top">
  <th colspan="2">Character</th>
  <th>Function</th>
</tr><tr>
<tr valign="top">
  <th>=</th>
  <th>equal</th>
  <td>Makes the matching of the search term case sensetive (prefix).
</tr><tr>
  <th>-</th>
  <th>minus</th>
  <td>Document matches only if the search term <i>does not</i> occur in it (prefix).</td>
</tr><tr>
  <th>"..."</th>
  <th>quotes</th>
  <td>Allow spaces inside search terms (circumfix).</td>
</tr><tr>
  <th>*</th>
  <th>asterisk</th>
  <td>Matches any sequence of numbers (0-9), letters (a-z) or apostrophes (\') (wildcard).</td>
</tr><tr>
  <th> </th>
  <th>space</th>
  <td>Wildcard matching the inverse of »*« (only inside phrases, i.e. within quotes) (wildcard).</td>
</tr>
</table>

<h3>Search Terms</h3>

<p>A search term may consist of either a word or a phrase. If you have more
than one search term then they are combined with logical "and", i.e. for a
document to match all search terms must be present (except when using negative
search terms, see below). A phrase is a search term containing one or more
spaces, these search terms must be given within <b>quotes</b> ("like this").
Asterisks and spaces are wildcard characters inside a phrase, while all other
characters are interpreted literally, outside a phrases only the asterisk can
be used as a wildcard character. One can not use quotes within a phrase (as
this would terminate the phrase).</p>

<h3>Modifiers</h3>

<p>There are two modifiers which may be prefixed to a search term (either
phrase or word). If any of these occur within a phrase (inside quotes) they are
interpreted literally. An <b>equal</b> sign makes the search term case
sensetive (quite useful when searching for something in Klingon) meaning that
it will only match words which are <i>identical</i> even when it comes to
upper/lower case. E.g. the search term »<tt>=voDleH</tt>« only matches the word
"voDleH", while the term »<tt>voDleH</tt>« would also match "VODLEH", "vodleh",
"VoDlEh" etc. A <b>minus</b> inverts the matching so that only a document which
does <i>not</i> contain the search term matches.</p>

<p>If you use minus and equal at the same time, they may come in either order
(»<tt>-=voDleH</tt>« and »<tt>=-voDleH</tt>« mean the same thing) but they must
always be placed outside any quotes (i.e. the search term »<tt>-="voDleH"</tt>«
means the same thing as the two previous examples, while »<tt>"-=voDleH"</tt>«
does not).</p>

<h3>Wildcards</h3>

<p>The <b>asterisk</b> is a wildcard character matching any sequence consisting
of zero or more letters (a-z), aphostrophes (\') and/or numbers (0-9). The
<b>space</b> is also a wildcard (when used within quotes) which matches the
exact opposite of the asterisk, i.e. any sequence of characters that <i>does
not</i> include a letter, aphostrophe or number. This means that the search
term »<tt>=jatlh qama\' jI\'oj</tt>« e.g. will find any file that contains the
text "jatlh qama'; jI'oj", even though when there is a semi-colon between the
two sentences.</p>

<!--
<h3>Source Files</h3>

EOF
    my @source = list_source_files();
    my $part = 3;
    my $step = $#source / $part + 1;
    print "<table class=\"layout\">\n";
    print "  <tr>\n";
    foreach (1..$part) {
        print "    <td><code><ul>\n";
        print "      <li>$_</li>\n" foreach splice(@source, 0, $step);
        print "    </ul></code></td>\n";
    }
    print "  </tr>\n";
    print "</table>\n";
    print "-->\n";
    print page_footer();                        # page footer
}

sub list_source_files {
    return map {
        m#^\.\./(.*)\.txt$#;
        $1;
    } glob("../[0-9]*.txt");
}

# url encode ascii/latin1 strings
sub url_encode ($) {                            #
    $_ = $_[0];                                 #
    s/([^-.*0-9A-Z_a-z ])/sprintf("%%%X", ord $1)/goe;
    s/ /+/go;                                   #
    return $_;                                  #
}

# html encode ascii/latin1 strings
sub html_encode {
    my ($str) = @_;
    for ($str) {
	s#&#&amp;#g;
	s#"#&quot;#g;
	s#<#&lt;#g;
	s#>#&gt;#g;
    }
    return $str;
}

sub transcript2html {
    my ($str) = @_;
    for ($str) {
	# ampersand
	s#&#&amp;#g;
	# double quotes
	s#(?<![[:alpha:]])"#&ldquo;#g;
	s#"#&rdquo;#g;
	# single quote/aphostrophe
	s#(?<![[:alpha:]])'#&lsquo;#g; 	# FIXME this should never happen in Klingon text!
	s#'#&rsquo;#g;
	$_ = matched_pair_subst($_, "<", ">", "<em>", "</em>");
	$_ = matched_pair_subst($_, "{", "}", "<strong class=\"tlh\">", "</strong>");
    }
    return $str;
}


# $STRING = matched_pair_subst($TRING, $OLDBRA, $OLDKET[, $NEWBRA, $NEWKET]);
#
# Replaces each $OLDBRA and $OLDKET with the corresponding $NEWBRA and $NEWKET.
#
# It is assumed that it is desired for each $OLDBRA and $OLDKET to be in
# matching pairs (like brackets, $OLDBRA is the leading bracket, and $OLDKET is
# the ending bracket), and if there are any brackets missing they will be added
# to the output string. Missing leading brackets will be added to the beginning
# of $STRING and missing trailing brackets will be added to the end.
#
# If $NEWBRA & $NEWKET is unspecified any incomplete bracket pairs will simply
# be completed, with no replacement made (resulting only in possible additions
# to the start and end of $STRING).
#
# Each "bracket" may consist of any number of characters, and this function can
# thus be used to convert e.g. bracket notation into HTML or vice versa.
#
# Examples:
#    matched_pair_subst("a(b", qw/( )/);             # -> "a(b)"
#    matched_pair_subst("a(b", qw/( ) [ ]/);         # -> "a[b]"
#    matched_pair_subst("a(b", qw#( ) <em> </em>#);  # -> "a<em>b</em>"
#    matched_pair_subst("a)b", qw/( )/);             # -> "(a)b"
sub matched_pair_subst {
    my ($string, $oldbra, $oldket, $newbra, $newket) = @_;
    $newbra = $oldbra unless defined($newbra);
    $newket = $oldket unless defined($newket);
    my $qoldbra = quotemeta($oldbra);
    my $qoldket = quotemeta($oldket);
    my (@head, @tail) = ();
    $string =~ s{ ($qoldbra|$qoldket) }{
	if ($1 eq $oldbra) {
	    push @tail, $newket;
	    $newbra;
	} else {
	    if (@tail and $tail[-1] eq $newket) {
		pop @tail;
	    } else {
		push @head, $newbra;
	    }
	    $newket;
	}
    }gex;
    return join("", @head) . $string . join("", @tail);
}




sub test {
    my ($code, $correct) = @_;
    my $result = eval $code;
    $result = "<undef>" unless defined($result);
    my $msg = ($result eq $correct) ? "OK" : "ERROR";
    print "$msg: $code returns '$result'" .
	($msg eq "ERROR" and " (should return '$correct')") .
	"\n";
    return;
}

if ($cfg{TEST}{html2transcript}) {
    test('matched_pair_subst("x(y", qw#( ) <em> </em>#)',   'x<em>y</em>');
    test('matched_pair_subst("x(y", "(", ")", "<em>", "</em>")',   'x<em>y</em>');
    test('matched_pair_subst("y)z", "(", ")", "<em>", "</em>")',   '<em>y</em>z');
    test('matched_pair_subst("x(y)z", "(", ")", "<em>", "</em>")', 'x<em>y</em>z');
    test('matched_pair_subst("x<y", "<", ">", "<em>", "</em>")',   'x<em>y</em>');
    test('matched_pair_subst("y>z", "<", ">", "<em>", "</em>")',   '<em>y</em>z');
    test('matched_pair_subst("x<y>z", "<", ">", "<em>", "</em>")', 'x<em>y</em>z');
    test('matched_pair_subst("a(b", qw/( )/)',                     "a(b)");
    test('matched_pair_subst("a(b", qw/( ) [ ]/)',                 "a[b]");
    test('matched_pair_subst("a)b", qw/( )/)',                     "(a)b");
    test('transcript2html("x<y")', 'x<em>y</em>');
    test('transcript2html("y>z")', '<em>y</em>z');
    test('transcript2html("x<y>z")', 'x<em>y</em>z');
    exit;
}


#sub log_query {
#    my $logpath = "$ENV{DOCUMENT_ROOT}/logs/";      # path
#    # set $date to current time
#    use Time::Local;                                #
#    ($sec, $min, $hour, $mday, $mon, $year) = localtime(time);
#    $date = sprintf "%04d-%02d-%02d, %02d.%02d.%02d",
#        1900+$year, ++$mon, $mday, $hour, $min, $sec;
#
#    ##############################################
#    # log query                                  #
#    if ($form{query}) {                          # if there is a query
#        if ( open(LOG,">>${logpath}archive_search.log") ) {
#            print LOG "$date $form{query}\n";    #   print log
#            close(LOG);                          #   close logfile
#        }                                        #
#        &inc_counter("${logpath}archive_search.count"); # inc log counter
#    } ############################################
#    return 1;
#}

sub inc_counter {
    my $file = shift;
    # Update counter in file
    if ( open(my $fh,"<$file") ) {      # läs räknare från fil
        ( my $count = <$fh> )++;
        close($fh);
        if (open($fh,">$file")) {    # skriv räknare till fil
            print $fh "$count\n";
            close($fh);
        }
        return $count;
    }
}

# takes:   STRING, STARTPOS, LENGTH
# returns: SUBSTRING, INCOMPETEVALUE
# (-1 if leftmost, 1 if rightmost, otherwise 0)
sub context ($$$) {
    my ($start, $length, $incomplete) =         # get args
        (@_[1, 2], 0);                          #
    if ($start <= 0) {                          # if negative startvalue
        $length += $start;                      #   crop off right end
        return "", -1 if $length <= 0;          #
        $start   =  0;                          #
        $incomplete  = -1;                      #   set incomplete to negative
    } elsif ($start+$length >= length($_[0])) { # if to big startvalue
        $incomplete = 1;                        #   set incomplete to negative
    }                                           #
    return substr($_[0], $start, $length),      # return substring and
        $incomplete;                            #   incomplete value
}

sub status_row (@) {
    my $text = join '', @_;
    return <<"EOF";
<br /><table cellpadding="1" cellspacing="0" border="0" width="100%">
  <tr bgcolor="#000000">
    <td><font size="-1" color="#ffffff">$text</font></td>
  </tr>
</table>
EOF
}

# return result header
# (e.g.: "There are 2 documents matching the query »chach«.")
sub display_matches () {
    my ($results, $query) = @_;
    my $num = ($results == 0 ? "no" : $results);
    my ($is, $pl) = do {
	if ($results == 1) {
	    ("is", "");
	} else {
	    ("are", "s");
	}
    };
    return status_row("There $is $num document$pl matching the query ",
        "»<tt>", html_encode($query), "</tt>«.");
}

our %abbr = (
    bop      => "<em>Bird of Prey Cutaway Poster</em>",
    ck       => "<em>Conversational Klingon</em>",
    email    => "Email",
    ftg      => "<em>Star Trek: Federation Travel Guide</em> (excerpt)",
    hallmark => "Hallmark Commercial",
    holqed   => "HolQeD",
    kgt      => "<em>Klingon for the Galactic Traveler</em>",
    news     => "News Group Posting",
    pk       => "<em>Power Klingon</em>",
    rt       => "Radio Times",
    sarek    => "<em>Sarek</em>",
    stc      => "<em>Star Trek: Communicator #104</em>",
    tkd      => "<em>The Klingon Dictionary</em>",
    tkw      => "<em>The Klingon Way</em>",
    sbx      => "<em>SkyBox Trading Card %s</em>",
);

sub file2title {
    my ($file, $query) = @_;
    $file =~ s#^$cfg{BASE_DIR}/##;
    my ($name) = $file =~ m/^.*--(.*).txt$/;
    # $name becomes "holqed", "rt", "tkd" etc
    my $title = do {
	my $title = "";
	if (my ($name2, $sbx) = $name =~ /^(sbx)-(.*)$/) {
	    $sbx =~ s/^ (\w*) 0+ /\U$1/x;
	    $title = sprintf($abbr{$name2}, $sbx);
	} else {
	    $title = "$abbr{$name}";
	}
    };
    $file  = url_encode($file);
    $query = url_encode($query);
    return $title,
	"$cfg{SCRIPT_URL}?file=$file&query=$query",
        "$cfg{SCRIPT_URL}?file=$file&get=source";
}

sub suggest_search () {
    return <<"EOF";
<p>You could try to:
<ul>
  <li>Make sure all words are spelled correctly.
  <li>Use different keywords.
  <li>Use more general keywords.
  <li>Turn off some negative search words (leading minus).
</ul>
EOF
}

sub no_matches {
    my ($number_of_matches) = @_;
    my ($pl) = ($number_of_matches == 1 ? "" : "s");
    return <<EOF;
<h2>There are no documents containing the string$pl you searched for.</h2>\n\n
EOF
}

sub too_many_matches {
    my ($number_of_matches) = @_;
    return <<"EOF";
<h2>Allowed number of matches ($cfg{MAX_MATCHES}) exceeded, search result
withheld.</h2>

<p align="justify">There are $number_of_matches files matching your query,
however the maximum allowed number of matches is $cfg{MAX_MATCHES}, and the
result of your query have therefore been withheld. You may try to narrow your
search (e.g. by specifying more search words or making your search
case-sensetive). More information on how to use this search engine can be found
in the section »<a href="$cfg{SCRIPT_URL}?get=help">Search Help</a>«.

<br />     This limitation has been imposed for copyright reasons, but should
hopefully not be to much of a obstruction. If you would like to contribute (with
ideas, suggestions, critisism, corrections, more data, whatever) please do not
hesitate to contact me <i>&lt;<a
href="mailto:zrajm\@klingonska.org">zrajm\@klingonska.org</a>&gt;</i>. I\'m
always interested to know what you think of this site.

EOF
}

sub display_source {
    my ($path, %form) = @_;
    # require password for TKD, TKW & KGT (and set cookie)
    if ($form{file} =~ m#-(tkd|tkw|kgt)\.txt$#) {
	print "Sorry, TKD, TKW and KGT cannot be displayed yet.\n";
	return;
    }
    print scalar read_file("$path/$form{file}");
    #open(my $fh, "<:encoding(utf8)", $form{file});
    #print <$fh>;
}


# resolve hypenation and remove comments
sub apply_corrections {
    my ($text) = @_;
    foreach ($text) {
	s/(?<=[$cfg{re_alph}])- *\Q[[keep hyphen]]\E\n/-/g; # keep hyphen
	s/(?<=[$cfg{re_alph}])-\n//g;          # remove hypenation
	s/(?<=--)\n//g;                        # keep en-dashes
	s# *\[\[.*?\]\]##g;                    # remove comments [[...]]
    }
    return $text;
}


sub display_file {
    my ($path, %form) = @_;
    $ENV{"X_PREV"} = "$cfg{SCRIPT_URL}?query=" . url_encode($form{query});
    my $query = new Query($form{query});
    print old_form($query->clean(), "Search only this file.", %form);      # output page header & form

    print status_row("Displaying file »<tt>$form{file}</tt>« ",
        "according to the query ",
        "»<tt>", html_encode($query->clean()), "</tt>«.");

    if ($form{file} =~ m#-(tkd|tkw|kgt)\.txt$#) {
	print "Sorry, TKD, TKW and KGT cannot be displayed yet. :(\n";
	return;
    }

    my ($text, %head) = read_file("$path/$form{file}");
    # FIXME - some error message if file not found

    $text = apply_corrections($text);

    # mark found word(s) (by inserting [[...]] around it - it is ok to use the
    # comment symbols, because we've already removed all the comments in the
    # text and we need something here that both is unaffected by the HTML
    # encoding and guaranteed not to occur in the text naturally
    my $query_mark = $query->mark();
    my @name = ();                              # clear array @name
    $text =~ s/ $cfg{re_bow} ($query_mark) $cfg{re_eow} /
	push @name, $1;
	"[[" . scalar(@name) . "[×]$1]]";
    /gex;

    $text = html_encode($text);                # htmlify text

    for ($text) {
	# convert the found word marks (i.e. [[...[×]...]]) into HTML tags
        s#\Q[[\E(.*?)\Q[×]\E(.*?)\Q]]\E#<font color="\#ff0000"><b><a name="$1">$2</a></b></font>#go;
        s#^====+$#<hr noshade />#gm;            # thick <hr />
        s#^----+$#<hr noshade width="50%" align="center" />#gm; # thin <hr />
        s#(?:\A\n+|\n+\Z)##sg;                  # leading/trailing blank lines
        s#\ (?=\ )# #g;                         # spaces = nbsp:es +1 space
        s#(\n\n+)(?!<)#$1<p>#g;                 # insert <p> after two lf
        s{^( &gt; | : |  | To:   |              # insert <br /> before lines
             Subject:    | Date: |              #   starting w/ punctuation
             Newsgroups: | From:                #   (boldify prefixes)
           )}{<br />$1}mxg;                     #
        s{^(<(?i:br|p)>)                        # insert <br /> before rows
           ( (?:&gt;\ *|:\ *)+ | To:   |        #   befinning with punctuation
             Subject:          | Date: |        #   (boldify row prefixes)
             Newsgroups:       | From:          #
           )}{$1<b>$2</b>}mxg;                  #
    }

    # FIXME: order links based on query strings

#    @expression = (); @number = (); $i = 0;
#    foreach $word (@name) {
#        $j = 0;
#        foreach my $regex (@query_regex) {  # for each regex
#            if ( $word =~ /$cfg{re_bow}$regex$cfg{re_eow}/ ) {
#                $expression[$j] = $query_word[$j];
#                $number[$j]     = $i;
#            }
#        } continue { $j++ }
#    } continue { $i++ }


    my %found = ();                                # clear a hash
    #my @found = ();                                # and an array
    my @query_regex = $query->regex();
    my @query_word  = $query->word();
  FOUND: foreach my $i (0..$#name) {
      EXPRESSION: foreach my $j (0..$#query_regex) {
            if ($name[$i] =~ /$cfg{re_bow}$query_regex[$j]$cfg{re_eow}/ ) {
                $found{$query_word[$j]} .= " $i";
                #push @found, $query_word[$j];
                next FOUND;
            }
        }
    }

    print "<dl>\n";
    my @query_not  = $query->not();
    my @query_case = $query->case();
    foreach my $i (0..$#query_word) {
        next if $query_not[$i];
        print "<dd>";
	my $word = $query_word[$i];
        my @x = split(" ", $found{$word});
        print "»<tt>$word</tt>« ",
            "(case ", ($query_case[$i] ? "" : "in"), "sensetive) ",
            "occur", ($#x != 0 ? "" : "s"), " ",  scalar(@x), " ",
            "time", ($#x == 0 ? "" : "s");
	if (@x) {
	    my $j = 0;
	    print " (";
	    foreach (@x) {
		print ", " if $j;
		print "<a href=\"#", ($_ + 1),"\">»", ++ $j, "</a>";
	    }
	    print ")";
	}
        print ".";
    }
    print "</dl>\n\n";
    print "<hr noshade />";

    print "<table>";
    foreach my $header (sort keys %head) {
	next if $header eq "style";
	print "  <tr><th valign=\"top\" align=\"left\">\u$header:</th><td>$head{$header}</tr></tr>";
    }
    print "</table>";
    print "<hr noshade />";
    print "\n$text\n\n";                     # output text
    print page_footer();                        # page footer
}


###############################################################################
##                                                                           ##
##  Initialization                                                           ##
##                                                                           ##
###############################################################################

# get form values
my %form = map {
    my $value = param($_);
    $_ => defined($value) ? $value : "";
} qw(file query get debug);

# strip path & untaint filename
($form{file}) = $form{file} =~ m#([^/]*$)#;

if ($form{file} and $form{get} eq "source") {
    print header("text/plain", -charset=>'utf-8');           # Content-type header
    display_source($cfg{BASE_DIR}, %form);
    exit;
}

# output content-type header
# (when used as SSI or loaded explicitly by
# browser, but not when called by other script)
if (not $ENV{X_CGI}) {                         # if not suppressed
    print header(-charset=>'utf-8');           # Content-type header
    $ENV{X_CGI} = "perl";                      #   and suppress it from now on
}                                              #

if ($form{debug}) {
    print <<EOF;
<table border="1">
<tr><th align="left">file</th><td>$form{file}</td></tr>
<tr><th align="left">query</th><td>$form{query}</td></tr>
<tr><th align="left">get</th><td>$form{get}</td></tr>
<tr><th align="left">debug</th><td>$form{debug}</td></tr>
</table>
EOF
}

# main selection
SWITCH: {
    $form{get} eq "help" and do {                # help page
	help_page();
	last SWITCH;
    };
    $form{get} eq "list" and do {                # help page
	help_page();
	last SWITCH;
    };
    $form{file} and do {                         # display a file
	display_file($cfg{BASE_DIR}, %form);
	last SWITCH;
    };
    $form{query} and do {                        # search result
	display_result($cfg{BASE_DIR}, %form);
	last SWITCH;
    };
    env("SERVER_PROTOCOL") eq "INCLUDED" and do { # SSI
	empty_form(%form);
	last SWITCH;
    };
    new_form();                                  # empty form
}

#[eof]
