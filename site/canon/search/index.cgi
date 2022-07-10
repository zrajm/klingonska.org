#!/usr/bin/perl

use strict;
use warnings;
use utf8;
use CGI qw(:standard);
binmode(STDIN,  ":encoding(utf8)");
binmode(STDOUT, ":encoding(utf8)");

my %METADATA = (
    title    => "Archive of Okrandian Canon",
    year     => "1998-2022",
    updated  => "2022-07-10T12:54:33+0200",
    logolink => "..",
    basedir  => "../..",
    crumbs   => [
        "canon/"         => "Archive of Okrandian Canon",
        "canon/search/"  => "Search",
    ],
);

# TODO
#
#     o word index for fast searches
#
#     o taint checks
#
#     o cleanup of code/data, place HTML last(?)
#
#     o show page numbers in search results preview (where applicable)
#
#     o test well-formedness of stylesheet + HTML
#

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
##  Query                                                                   ##
##                                                                          ##
##############################################################################
{
    package Query;
    # $query            = original query (string)
    # $query_clean      = query as it was interpreted
    # @query_regex[$i]  = the one used to grep through files, of i length
    #   @query_word[$i] = the words of the query (un-regexed)
    #   @query_not [$i] = true when $query_regex[$i] shouldn't match
    #   @query_case[$i] = true when $query_regex[$i] is case sensetive
    # $query_mark       = single regex for marking matches in output
    #
    # This thing splits a string into words if a "word" contains spaces it
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
		next if /^[-+=]*[ *]*$/;       # skip wildcard-only words
		my ($prefix, $word)            # extract prefix & del quotes
                    = m#^([-+=]*)"?([^"]*)#;
		$word =~ s/([ *])\1*/$1/g;     # squash multiple stars/spaces
		my $not   = ($prefix =~ m/-/ ? "-" : "");
		my $case  = ($prefix =~ m/=/ ? "=" : "");
		my $regex = regexify($word, $case);
		push @case,  $case;            # ignore case prefix
		push @clean, $not . $case .    # cleaned-up version of query
		    ($word =~ m/(?:^[-+=]|\s)/ ? qq("$word") : $word);
		if ($not) {
		    $not_count ++;
		} else {
		    push @mark,  $regex;       # text highlight regex
		}
		push @not,   $not;             # negation prefix
		push @regex, $regex;           # word -> regex
		push @word,  $word;            # word (excluding) prefix
	    }
	    my $regex = "(" . join("|", @mark) . ")";
	    $self->{case}  = \@case;
	    $self->{clean} = join(" ", @clean);
	    $self->{mark}  = qr/$regex/;
	    $self->{not}   = \@not;
	    $self->{regex} = \@regex;
	    $self->{word}  = \@word;
            if ($not_count > 0) {
                $self->{error} = "You may not negate all search words"
                    if $not_count == @word;
            } else {
                $self->{error} = "No search words specified"
                    if @word == 0;
            }
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

##############################################################################
##                                                                          ##
##  Settings                                                                ##
##                                                                          ##
##############################################################################

our %cfg = (
    DESC_LENGTH    => 300,                     # max length of file descr.
    # Context length is always shortened, so this is only an approximate value
    # (it can never grow bigger than this though).
    CONTEXT_LENGTH => 35,                      # max length of found context
    BASE_DIR       => "..",

    # things for regexes
    re_alph => q/'0-9A-Za-z/                   # alphabetical characters
        . q/ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞß/   #   (note that apostrophe
        . q/àáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ/,  #   is included)

    # unit test stuff
    TEST => { html2transcript => "" },
);
# word boundaries for regexes
$cfg{re_bow} = "(?:\\A|(?<![$cfg{re_alph}]))"; # beginning of word
$cfg{re_eow} = "(?:\\Z|(?![$cfg{re_alph}]))";  # end of word

##############################################################################
##                                                                          ##
##  Functions                                                               ##
##                                                                          ##
##############################################################################

sub url_query {
    my %arg = @_;
    return "" if keys %arg == 0;
    return "?" . join "&", map {
        url_encode($_) . "=" . url_encode($arg{$_});
    } sort keys %arg;
}

sub is_copyrighted {
    my ($transcript_file) = @_;
    return $transcript_file =~ m#-(tkd|tkw|kgt)\.txt$# ? 1 : "";
}

{
    my %month = (
        "01" => "Jan", "02" => "Feb", "03" => "Mar", "04" => "Apr",
        "05" => "May", "06" => "Jun", "07" => "Jul", "08" => "Aug",
        "09" => "Sep", "10" => "Oct", "11" => "Nov", "12" => "Dec",
    );
    sub short_text_date {
        my ($year, $month, $day) = @_;
        $month = $month{$month} if defined $month;
        $day   =~ s/^0+//       if defined $day;
        return defined($month)
            ? $month . (defined $day ? " $day" : "") . ", $year"
            : "$year";
    }
}

# Usage: ($TEXT[, %HEAD]) = read_file($FILE);
#
# In list context reads & parses $FILE, returning $TEXT [[...]] header data in
# %HEAD.
#
# In scalar context $FILE is returned as-is, any header is unparsed and
# included in $TEXT.
#
# $FILE is a plain text file, or KA transcript file with leading [[...]]
# header containing metadata (such as author, date, publisher etc.).
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

sub download_page {
    return <<"EOF";
<p>Sorry, search results for the major canon works cannot be displayed
  yet. <nobr>:(</nobr> – You <i>can</i> look at their transcripts, however.

<ul>
  <li>1992 – <i><a href="../1992-01-01-tkd.txt">The Klingon Dictionary</a></i>
  <li>1992 – <i><a href="../1992-10-01-ck.txt">Conversational Klingon</a></i>
  <li>1993 – <i><a href="../1993-10-01-pk.txt">Power Klingon</a></i>
  <li>1996 – <i><a href="../1996-05-01-tkw.txt">The Klingon Way</a></i>
  <li>1997 – <i><a href="../1997-11-01-kgt.txt">Klingon for the Galactic Traveler</a></i>
</ul>

<p>In order to access these you’ll need a copy <i>The Klingon Dictionary</i>.
EOF
}

# Return array of HTML. One line per element (without trailing newlines).
sub metadata_table {
    my %hash = @_;
    return qq(<table>),
        %hash ? (
            map {
                (!/^style$/x and $hash{$_}) ? (
                    qq(  <tr>),
                    qq(    <th class="right light">\u$_),
                    qq(    <td>) . transcript2html($hash{$_}),
                ) : ();
            } (sort keys %hash),
        ) : qq(  <tr><th class=light>Missing metadata),
        qq(</table>);
}

sub match_links {
    my ($query, $found, $query_word) = @_;
    return "" unless %$found;
    my @out;
    my @query_not  = $query->not();
    my @query_case = $query->case();
    my $count      = 0;
    foreach my $i (0..$#$query_word) {
        next if $query_not[$i];
	my $word = $query_word->[$i];
        my @x = split(" ", $found->{$word});
	if (@x) {
            push @out, sprintf(
                "%s»<tt>%s</tt>« ",
                ($i > 0 ? "<br>" : ""),
                $word,
            );
            push @out, join " ", map {
                $count += 1;
                qq(<a href="#$count">›$_</a>);
            } 1..@x;
	}
    }
    return @out;
}

sub strip_path {
    my ($file) = @_;
    $file =~ m{ ([^/]*) $}x;
    return $1;
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

sub strip_after_comma {
    (local $_) = @_;
    s/,.*//;
    return $_;
}

# Usage: ($year, $month, $day, $suf, $title) = split_filename($file);
#
# Filenames are expected to be in format: YYYYa-TITLE.txt, YYYY-MMa-TITLE.txt
# or YYYY-MM-DDa-TITLE.txt, where 'a' is an optional letter ('a', 'b', 'c'
# etc.) to distinguish otherwise identical sources.
#
# Return empty array if filename couldn't be analyzed. One or more components
# may be undef if they're not specified in the filename. Any leading path is
# ignored.
sub split_filename {
    local ($_) = @_;
    if (m{^ (?:.*/)? (0|\d{4}) (?:-(\d{2}) (?:-(\d{2}))? )? \w? - ([^/]*) [.]txt $}x) {
        return ($1, $2, $3, $4, $5);
    }
    return ();
}

sub result_page {
    my ($path, %form) = @_;
    my $query = Query->new($form{q});
    # file name globbing
    my @file    = sort glob "$cfg{BASE_DIR}/[0-9]*.txt";
    my $matches = 0;                           # number of matches found
    my $out     = "";                          # output buffer
    if ($query->error()) {
        $out  = "<h2>" . $query->error() . "</h2>\n\n";
        $out .= suggest_search();
    } else {                                   # not all words are negated
        $out .= qq(<dl class=found>\n);
	my @query_regex = $query->regex();
	my @query_not   = $query->not();
	my $query_mark  = $query->mark();
        foreach my $file (@file) {
	    my ($text, %head) = read_file($file);
	    $text = strip_comments($text);
	    foreach my $j (0..$#query_regex) {
		if ($text =~ /$cfg{re_bow}$query_regex[$j]$cfg{re_eow}/
                        xor $query_not[$j]
                ) {
		    $matches += 1;
		    $out .= store_match(
                        file  => strip_path($file),
                        meta  => \%head,
                        text  => $text,
                        query => $form{q},
                        mark  => $query_mark,
                    );
		}
	    }
        }
	$out .= "</dl>";
    }
    return
        old_form(
            %form,
            clean_query => $query->clean,
        )
        . status_row(
            "%s document%s found.",
            $matches == 0 ? "No" : $matches,
            $matches == 1 ? ''   : 's',
        )
        . $out;
}

sub match_summary {
    my ($text, $query_mark) = @_;
    # FIXME: This while loop should probably be re-written to use as many
    # *different* matching words as possible. Instead of just outputting the x
    # number of matches that comes first in each file. A loop over (parts of)
    # $query_regex[$i] could prove fruitful.
    my ($characters, $context, $incomplete, $out) = (0, "", "", "");
    while (
        $characters < $cfg{DESC_LENGTH}
            and $text =~ /$cfg{re_bow}$query_mark$cfg{re_eow}/gx
    ) {
        # Get word context (= text before and after word)
        ($context, $incomplete) = do {
            my $start  = pos($text) - length($1) - $cfg{CONTEXT_LENGTH};
            my $length = $cfg{CONTEXT_LENGTH} * 2 + length($1);
            context($text, $start, $length);
        };
        for ($context) {
            # TODO: remove or keep?
            # (This thingy removes the line quote signs ":" and ">".)
            s#\n+(?:[>:] *)*# #g;

            # trim initial half-word & space
            s#\A  [$cfg{re_alph}]* [^$cfg{re_alph}]+ ##sox
                unless $incomplete < 0;

            # trim final space & half-word
            s#   [^$cfg{re_alph}]+  [$cfg{re_alph}]* \Z##sox
                unless $incomplete > 0;

            s/\s+/ /g;                         # squash space & linefeeds
            $characters += length $context;    # size of match description

            # Mark found words by inserting [[...]] around it (it is ok to use
            # the comment symbols, because we've already removed all the
            # comments in the text and we need something here that both is
            # unaffected by the HTML encoding and guaranteed not to occur in
            # the text naturally.
            s{ \Q[[\E | \Q]]\E }{}gx;          # strip any remaining [[ or ]]
            s#$cfg{re_bow}($query_mark)$cfg{re_eow}#[[$1]]#g;
            $context = transcript2html($context);

            # convert the found word marks (i.e. [[...]]) into HTML tags
            s#\Q[[\E#<mark>#go;
            s#\Q]]\E#</mark>#go;
        }
        $out .= ($incomplete >= 0 ? qq(…) : qq()) . qq( $context);
    }
    return $out . ($incomplete <= 0 ? " …" : "");
}

# TEXT is contents if FILE, with comments and hyphenation removed and without
# metadata header.
sub store_match {
    my %arg = @_;
    my ($file, $text, $query, $query_mark, $head)
        = @arg{qw(file text query mark meta)};

    my ($isodate, $date) = ("");
    if (my ($year, $month, $day) = split_filename($arg{file})) {
        $isodate = join("-", grep { defined } $year, $month, $day);
        $date    = short_text_date($year, $month, $day);
    }

    # FIXME: We should display matches of TKD, CK, PK the other canon works
    # differently, so that page numbers are shown for each match.

    # get name of document
    my ($source_link, $title, $view_link) = file2title($arg{file}, $query);
    $title = transcript2html($head->{title}) if exists($head->{title});

    my @meta = (
	($source_link ? qq(<a href="$source_link">Transcript</a>) : ()),
        (exists($head->{type})      ? ucfirst($head->{type}) : ()), # type (book, email etc.)
        (exists($head->{author})    ? $head->{author}        : ()),
        (exists($head->{publisher}) ? strip_after_comma($head->{publisher}) : ()),
    );
    if (@meta == 1) {
        push @meta, "&lt;Missing metadata&gt;";
    }
    my $summary = match_summary($text, $query_mark);
    my $meta    = join(" - ", @meta);
    return <<"EOF";
  <dt><a href="$view_link">$title</a>
  <dd><small>
    <span class=light>$meta</span>
    <br><time class=light datetime="$isodate">$date</time>
    $summary
  </small>

EOF
}

# Called with no args results in empty form being rendered.
sub old_form {
    my (%arg) = @_;
    $arg{$_} //= "" foreach qw(file q clean_query message);

    # Hidden form element set when displaying a single file.
    # This is set when displaying a single file.
    my $file_arg = $arg{file}
        ? do {
            my $value = html_encode($arg{file});
            qq(\n<input type=hidden name=file value="$value">)
        } : "";
    my $prettify = "";
    if ($arg{clean_query} ne $arg{q}) {
        my %q = (
            q => url_encode($arg{clean_query}),
            exists $arg{file}
                ? (file => url_encode($arg{file}))
                : (),
        );
        my $param = join('&', map { "$_=$q{$_}" } keys %q);
        $prettify = qq(<br>• <a href="?$param">Prettify</a>);
    }
    if ($arg{message}) {
        $arg{message} =
            "\n    <tr><td class=center><small>$arg{message}</small>";
    }
    return raw_form(
        url    => "",
        hidden => $file_arg,
        note   => $arg{message},
        query  => html_encode($arg{q} // ""),
        link   => $prettify,
    );
}

sub raw_form {
    my (%form) = @_;
    return <<"EOF";

<form method=get action="$form{url}">$form{hidden}
  <table class="layout noborder">$form{note}
    <tr class=middle>
      <td><input name=q value="$form{query}"
        size=35 autofocus placeholder="Search archive…"
        ><button type=submit title="Search"
        ><img alt="Magnifying glass" src="../../pic/magnify.svg"
        ></button>
      <td><small>• <a href="$form{url}?get=help">Help</a>$form{link}</small>
  </table>
</form>
EOF
};

sub search_help {
    return <<'EOF';

<h2>Search Help</h2>

<table>
  <tr>
    <th colspan=2>Character
    <th>Function
  <tr>
    <th><code>=</code>
    <th>equal
    <td>Makes the matching of the search term case sensetive (prefix).
  <tr>
    <th><code>-</code>
    <th>minus
    <td>Document matches only if the search term <i>does not</i> occur in it (prefix).
  <tr>
    <th><code>"</code>…<code>"</code>
    <th>quotes
    <td>Search for a phrase which contains spaces.
  <tr>
    <th><code>*</code>
    <th>asterisk
    <td>Wildcard matching any sequence of numbers <nobr>(0–9),</nobr> letters
      <nobr>(a–z)</nobr> and apostrophes <nobr>(')</nobr>.
  <tr>
    <th><code> </code>
    <th>space
    <td>Within quotes the space is a wildcard matching all non-alphabetic
      characters (the opposite of “<code>*</code>”).
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
of zero or more letters <nobr>(a–z),</nobr> aphostrophes (') and/or numbers
<nobr>(0–9).</nobr> The <b>space</b> is also a wildcard (when used within
quotes) which matches the exact opposite of the asterisk, i.e. any sequence of
characters that <i>does not</i> include a letter, aphostrophe or number. This
means that the search term »<tt>=jatlh qama' jI'oj</tt>« e.g. will find any
file that contains the text "jatlh qama'; jI'oj", even though when there is a
semicolon between the two sentences.</p>
EOF
}

sub help_page {
    return old_form . search_help;
}

# url encode ascii/latin1 strings
sub url_encode {
    my ($str) = @_;
    for ($str) {
        s/([^-.*0-9A-Z_a-z ])/sprintf("%%%X", ord $1)/goe;
        s/ /+/go;
    }
    return $str;
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
	s#&#&amp;#g;
	s#(?<![[:alpha:]])"#&ldquo;#g; 	       # double quote
	s#"#&rdquo;#g;
	s#(?<![[:alpha:]])'#&lsquo;#g;         # single quote/aphostrophe
	s#'#’#g;
        s#(?<!-)--(?!-)#–#g;                   # en-dash
	$_ = matched_pair_subst($_, "<", ">", "<i>", "</i>");
	$_ = matched_pair_subst($_, "{", "}", "<b lang=tlh>", "</b>");
    }
    return $str;
}

# $STRING = matched_pair_subst($TRING, $OLDBRA, $OLDKET[, $NEWBRA, $NEWKET]);
#
# Replaces each $OLDBRA and $OLDKET with the corresponding $NEWBRA and
# $NEWKET.
#
# It is assumed that it is desired for each $OLDBRA and $OLDKET to be in
# matching pairs (like brackets, $OLDBRA is the leading bracket, and $OLDKET
# is the ending bracket), and if there are any brackets missing they will be
# added to the output string. Missing leading brackets will be added to the
# beginning of $STRING and missing trailing brackets will be added to the end.
#
# If $NEWBRA & $NEWKET is unspecified any incomplete bracket pairs will simply
# be completed, with no replacement made (resulting only in possible additions
# to the start and end of $STRING).
#
# Each "bracket" may consist of any number of characters, and this function
# can thus be used to convert e.g. bracket notation into HTML or vice versa.
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

# takes:   STRING, STARTPOS, LENGTH
# returns: SUBSTRING, INCOMPETEVALUE
# (-1 if leftmost, 1 if rightmost, otherwise 0)
sub context {
    my ($start, $length, $incomplete) =         # get args
        (@_[1, 2], 0);
    if ($start <= 0) {                          # if negative startvalue
        $length += $start;                      #   crop off right end
        return "", -1 if $length <= 0;
        $start   =  0;
        $incomplete  = -1;                      #   set incomplete to negative
    } elsif ($start+$length >= length($_[0])) { # if to big startvalue
        $incomplete = 1;                        #   set incomplete to negative
    }
    return substr($_[0], $start, $length),      # return substring and
        $incomplete;                            #   incomplete value
}

sub status_row {
    my ($text, @var) = @_;
    return sprintf qq(\n<div class=summary>$text</div>\n\n), map {
        html_encode($_);
    } @var;
}

sub file2title {
    my ($file, $query) = @_;
    my ($title) = $file =~ m#([^/]*)$#;
    $file  = url_encode($file);
    $query = url_encode($query // "");
    return (
        "../$file",
        $title,
	"?file=$file&q=$query",
    );
}

sub suggest_search {
    return <<"EOF";
<p>You could try to:
<ul>
  <li>Make sure all words are spelled correctly.
  <li>Use different search words.
  <li>Use more general search words.
  <li>Turn off some negative search words (leading minus).
</ul>
EOF
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

sub file_page {
    my ($path, %form) = @_;
    my $query = Query->new($form{q});
    my $out   = old_form(                      # output search form
        %form,
        clean_query => $query->clean(),
        message     => "Search only this file.",
    );
    my ($transcript_link) = file2title($form{file});
    $out .= status_row(
        qq(<a href="%s">Transcript</a> – Displaying file »<tt>%s</tt>«),
        $transcript_link,
        $form{file},
    );

    if (is_copyrighted($form{file})) {
        return download_page;
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
        s#\Q[[\E(.*?)\Q[×]\E(.*?)\Q]]\E#<mark id=$1>$2</mark>#go;
        s#^====+$#<hr noshade>#gm;            # thick <hr>
        s#^----+$#<hr noshade width="50%" align=center>#gm; # thin <hr>
        s#(?:\A\n+|\n+\Z)##sg;                  # leading/trailing blank lines
        s#\ (?=\ )# #g;                         # spaces = nbsp:es +1 space
        s#(\n\n+)(?!<)#$1<p>#g;                 # insert <p> after two lf
        s{^( &gt; | : |  | To:   |              # insert <br> before lines
             Subject:    | Date: |              #   starting w/ punctuation
             Newsgroups: | From:                #   (boldify prefixes)
           )}{<br>$1}mxg;
        s{^(<(?i:br|p)>)                        # insert <br> before rows
           ( (?:&gt;\ *|:\ *)+ | To:   |        #   befinning with punctuation
             Subject:          | Date: |        #   (boldify row prefixes)
             Newsgroups:       | From:
           )}{$1<b>$2</b>}mxg;
    }

    my %found = ();                                # clear a hash
    my @query_regex = $query->regex();
    my @query_word  = $query->word();
  FOUND: foreach my $i (0..$#name) {
      EXPRESSION: foreach my $j (0..$#query_regex) {
            if ($name[$i] =~ /$cfg{re_bow}$query_regex[$j]$cfg{re_eow}/ ) {
                $found{$query_word[$j]} .= " $i";
                next FOUND;
            }
        }
    }

    return $out . join(
        "\n",
        match_links($query, \%found, \@query_word),
        "",
        metadata_table(%head),
        "",
        $text,
    );
}

sub http_header { return header(-charset => 'utf-8') }

##############################################################################
##                                                                          ##
##  Initialization                                                          ##
##                                                                          ##
##############################################################################

# get form values
my %form = map {
    my $value = param($_);
    defined($value) ? ($_ => $value) : ();
} qw(file q query get debug);

# Backward compatibility (so old links to this page continue to work)
$form{q} = delete $form{query} if exists $form{query}; # 'query' = 'q'

# strip path & untaint filename
$form{file} = strip_path($form{file})
    if exists $form{file};

##############################################################################
##                                                                          ##
##  Main                                                                    ##
##                                                                          ##
##############################################################################

my $page = Local::Page->new(%METADATA);

# main selection

if ($form{get} // "") {
    if ($form{get} eq "source" and ($form{file} // "")) {  # 'get=source'
        print redirect("../$form{file}");
        exit;
    } elsif ($form{get} =~ /^(help|list)$/) {  # 'get=help' or 'get=list'
        print http_header
            . $page->header
            . help_page
            . $page->footer;
        exit;
    }
}

$form{file} //= "";
if ($form{file}) {                             # show file
    $page->set(                                #   reset the logo-link URL
        logolink => url_query(do {
            my %x = %form;
            delete $x{file};
            %x;
        })
    );
    print http_header
        . $page->header
        . file_page($cfg{BASE_DIR}, %form)
        . $page->footer;
} elsif ($form{q}) {                           # show search results
    print http_header
        . $page->header
        . result_page($cfg{BASE_DIR}, %form)
        . $page->footer;
} else {                                       # default page
    print http_header
        . $page->header
        . help_page
        . $page->footer;
}

#[eof]
