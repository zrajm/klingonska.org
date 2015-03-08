#!/usr/bin/perl -w

use strict;
use warnings;
use utf8;
use CGI qw(:standard);
binmode(STDIN,  ":encoding(utf8)");
binmode(STDOUT, ":encoding(utf8)");

my $TITLE   = "The <b lang=tlh>pIqaD</b> Playground";
my $YEAR    = "2000-2014";
my $UPDATED = "2014-11-08T22:12:06+0100";
my $DIR     = "../..";
my @CRUMBS  = (
    #"writing/"      => "?",
    "writing/play/" => "The pIqaD Playground",
);

# Translate romanized Klingon into HTML-pages with inlined pIqaD images.
#
# Alphabet translation table is intended to translate from text to pIqaD-gifs
# (right now it justs translates from romanized into KLIpIqaDmey typeface
# encoding).
#
# This could be done more nicely using here-documents or custom data files
# (should be used to convert any text into HTML with any of the inline
# pIqaD-gifs). Which of the pIqaDs should be selectable from the form.
{
    my %alphabet = (
        a   => '<img src="/piq/bg1/a.gif" width=38 height=39 alt="a">',
        b   => '<img src="/piq/bg1/b.gif" width=37 height=39 alt="b">',
        ch  => '<img src="/piq/bg1/ch.gif" width=42 height=39 alt="ch">',
        D   => '<img src="/piq/bg1/d.gif" width=29 height=39 alt="D">',
        e   => '<img src="/piq/bg1/e.gif" width=26 height=39 alt="e">',
        gh  => '<img src="/piq/bg1/gh.gif" width=43 height=39 alt="gh">',
        H   => '<img src="/piq/bg1/h.gif" width=21 height=39 alt="H">',
        I   => '<img src="/piq/bg1/i.gif" width=31 height=39 alt="I">',
        j   => '<img src="/piq/bg1/j.gif" width=36 height=39 alt="j">',
        l   => '<img src="/piq/bg1/l.gif" width=28 height=39 alt="l">',
        m   => '<img src="/piq/bg1/m.gif" width=27 height=39 alt="m">',
        n   => '<img src="/piq/bg1/n.gif" width=33 height=39 alt="n">',
        ng  => '<img src="/piq/bg1/ng.gif" width=41 height=39 alt="ng">',
        o   => '<img src="/piq/bg1/o.gif" width=36 height=39 alt="o">',
        p   => '<img src="/piq/bg1/p.gif" width=26 height=39 alt="p">',
        q   => '<img src="/piq/bg1/q.gif" width=18 height=39 alt="q">',
        Q   => '<img src="/piq/bg1/qh.gif" width=27 height=39 alt="Q">',
        r   => '<img src="/piq/bg1/r.gif" width=33 height=39 alt="r">',
        S   => '<img src="/piq/bg1/s.gif" width=39 height=39 alt="S">',
        t   => '<img src="/piq/bg1/t.gif" width=36 height=39 alt="t">',
        tlh => '<img src="/piq/bg1/tlh.gif" width=35 height=39 alt="tlh">',
        u   => '<img src="/piq/bg1/u.gif" width=38 height=39 alt="u">',
        v   => '<img src="/piq/bg1/v.gif" width=44 height=39 alt="v">',
        w   => '<img src="/piq/bg1/w.gif" width=34 height=39 alt="w">',
        y   => '<img src="/piq/bg1/y.gif" width=35 height=39 alt="y">',
        "'" => qq(<img src="/piq/bg1/z.gif" width=10 height=39 alt="'">),
        0   => '<img src="/piq/bg1/0.gif" width=30 height=39 alt="0">',
        1   => '<img src="/piq/bg1/1.gif" width=36 height=39 alt="1">',
        2   => '<img src="/piq/bg1/2.gif" width=17 height=39 alt="2">',
        3   => '<img src="/piq/bg1/3.gif" width=26 height=39 alt="3">',
        4   => '<img src="/piq/bg1/4.gif" width=34 height=39 alt="4">',
        5   => '<img src="/piq/bg1/5.gif" width=20 height=39 alt="5">',
        6   => '<img src="/piq/bg1/6.gif" width=35 height=39 alt="6">',
        7   => '<img src="/piq/bg1/7.gif" width=28 height=39 alt="7">',
        8   => '<img src="/piq/bg1/8.gif" width=37 height=39 alt="8">',
        9   => '<img src="/piq/bg1/9.gif" width=27 height=39 alt="9">',
        #   " " => '<img src="/piq/bg1/_space.gif" width=27 height=39 alt="_">',
        " " => '       ',
        "," => '       <img src="/piq/bg1/_half.gif" width=25 height=39 alt=",">',
        ";" => '       <img src="/piq/bg1/_half.gif" width=25 height=39 alt=";">',
        ":" => '       <img src="/piq/bg1/_half.gif" width=25 height=39 alt=":">',
        "." => '       <img src="/piq/bg1/_full.gif" width=25 height=39 alt=".">',
        "?" => '       <img src="/piq/bg1/_full.gif" width=25 height=39 alt="?">',
        "!" => '       <img src="/piq/bg1/_full.gif" width=25 height=39 alt="!">',
        "#" => '<img src="/piq/bg1/_empire.gif" width=39 height=39 alt="¶">',
        "<" => '<img src="/piq/bg1/_empire2.gif" width=32 height=39 alt="¶">',
        ">" => '<img src="/piq/bg1/_ka.gif" width=44 height=39 alt="¶">',
        "{" => '',
        "}" => '',
        "\n"=> "\n<br><br>",
    );
    # make a search pattern for above alphabet translation
    my $find_chars = join "|", map {
        quotemeta;
    } sort { length($b) <=> length($a) } keys %alphabet;

    sub klinprint {
        my ($text) = @_;
        foreach ($text) {
            # Match the character following the current character (used in order to
            # split {ngh} into {n} and {gh}, rather than {ng} and *{h}).
            s{
                ($find_chars)
                (?=$find_chars|[^a-z]|$)
            }{$alphabet{$1}}gex;          # translate alphabet
        }
        return $text;
    }
}

{
    my %char = (
        qq(&) => "&amp;", qq(")  => "&quot;", qq(<) => "&lt;",
        qq(>) => "&gt;",  qq(\n) => "<br>",
    );
    sub html_encode {
        my @x = @_;
        foreach (@x) {
            s#([\"<>&])#$char{$1}#ge; # encode it with `%HX' notation
        }
        return $x[0] if $#x == 0;
        return @x;
    }
}

# Usage: $TEXTDATE = text_date($ISODATE);
#
# Converts datestring (beginning with a YEAR-MM-DD) into a descriptive plain
# text date like "January 1, 2012". Only year, month and day is included, and
# anything coming after the initial date in $ISODATE is ignored.
{
    my @month = qw(
        January   February  March      April    May       June
        July      August    September  October  November  December
    );
    sub text_date {
        my ($date) = @_;
        # Accepts only ISO dates beginning with "1999-12-31"
        if ($date =~ m/^(\d{4})-0?(\d{1,2})-0?(\d{1,2})/) {
            my ($year, $month, $day) = ($1, $2, $3);
            return "$month[$month - 1] $day, $year";
        }
        return "UNKNOWN DATE";
    }
}

sub breadcrumbs {
    my @crumbs;
    my @temp = ("" => "Home", @CRUMBS);
    while (my ($path, $title) = splice(@temp, 0, 2)) {
        my $attr = (@temp == 0) ? " itemprop=url" : "";
        push @crumbs, qq(<a href="http://klingonska.org/$path"$attr>$title</a>);
    }
    return join(qq( ›\n        ), @crumbs);
}

sub page_header {
    my (%hash) = @_;
    my $isodate   = $UPDATED;
    my $text_date = text_date($isodate);
    my $crumbs    = breadcrumbs();
    my $backlink  = exists $hash{file}         # used by canon/index.cgi
        ? qq(?q=) . url_encode($hash{query})
        : "../../";
    (my $title = $TITLE) =~ s#<.*?>##g;
    return <<"EOF";
<!doctype html>
<!--[if lt IE 7]> <html class="no-js lt-ie9 lt-ie8 lt-ie7" lang=en> <![endif]-->
<!--[if IE 7]>    <html class="no-js lt-ie9 lt-ie8" lang=en> <![endif]-->
<!--[if IE 8]>    <html class="no-js lt-ie9" lang=en> <![endif]-->
<!--[if gt IE 8]><!--> <html class="no-js" lang=en> <!--<![endif]-->
<head>
  <meta charset="UTF-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">
  <title>$title – Klingonska Akademien</title>
  <meta name=viewport content="width=device-width">
  <link rel=stylesheet href="$DIR/includes/base.css">
  <link rel=stylesheet href="$DIR/includes/banner.css">
  <link rel=stylesheet href="$DIR/includes/dict.css">
  <link rel=stylesheet href="$DIR/includes/dict-layouttable.css">
  <link rel=stylesheet href="$DIR/includes/canon-search.css">
  <link rel=icon href="/favicon.ico">
  <link rel=canonical href="http://klingonska.org/">
  <script src="$DIR/includes/modernizr-2.5.3.js"></script>
</head>
<body lang=en itemscope itemtype="http://schema.org/WebPage">

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
    <a href="$backlink">
      <table id=logotitle>
        <td>
          <span class=crop>
            <img height=200 width=200 src="$DIR/pic/ka-logo.svg" alt="Klingonska Akademien">
          </span>
        <td>
          <h1>Klingonska<span id=logospace>&nbsp;</span>Akademien</h1>
      </table>
    </a>
  </div>
</header>

<div role=main itemprop=mainContentOfPage>

<h1>$TITLE</h1>
EOF
}

sub html_form {
    my %query = @_;
    (my $form_name = $0) =~ s/^.*\///;
    return <<"EOF";
<form method=post action="$form_name" class=center>
  Write something in Klingon to see it written in <b>pIqaD</b>.
  <br><textarea name=text rows=11 cols=40>$query{text}</textarea>
  <br
    ><button type=submit>Show</button
    ><button type=submit name=hide>Hide form</button
    > <nobr> • <a href="help.html">Help</a></nobr>
</form>
EOF
}

sub page_footer {
    my ($year1, $year2) = $YEAR =~ /(\d+)[[:punct:]]+(\d+)/;
    return <<"EOF";
</div>

<footer role=contentinfo>
  <p class=copyright>© <time itemprop=copyrightYear>$year1</time>–<time>$year2</time> by
    <a href="mailto:zrajm\@klingonska.org" rel=author itemprop=author>zrajm</a>,
    <a href="http://klingonska.org/" itemprop=sourceOrganization>Klingonska Akademien</a>, Uppsala
  <p>License: <a href="http://creativecommons.org/licenses/by-sa/3.0/" rel=license>CC BY-SA</a>
</footer>
<script>var _gaq=[['_setAccount','UA-5434527-2'],['_trackPageview']];
(function(d,t){var g=d.createElement(t),s=d.getElementsByTagName(t)[0];
g.src=('https:'==location.protocol?'//ssl':'//www')+'.google-analytics.com/ga.js';
s.parentNode.insertBefore(g,s)}(document,'script'))</script>
<script src="$DIR/includes/titlewrap.js"></script>
</body>
</html>
EOF
}

sub default_text {
    return <<"EOF";
yIjatlh SoHvaD jIjatlh.
bItam.
yIjatlh jIjach.
bItamqu'.
yIjatlh jItlhup.
'ach not bI'Ij. bItam.
reH bItam.

< qonta' maHvatlh >
EOF
}

# read form parameters
my %query = map { ($_ => param($_)) } param();

if (not exists($query{text})) {
    $query{text} = default_text();
}

if (exists $query{info}) {
    print redirect("./help.html");
}

# output content-type header
# (when used as SSI or loaded explicitly by
# browser, but not when called by other script)
if (not $ENV{X_CGI}) {                         # if not suppressed
    print header(-charset=>'utf-8');           #   Content-type header
    $ENV{X_CGI} = "perl";                      #   and suppress it from now on
}                                              #

if (not exists $query{text}) {
    $query{text} = default_text();
}

print page_header()
    . "<center>\n\n"
    . (exists $query{hide} ? "" : html_form(%query))
    . "<p>"
    . klinprint($query{text})
    . "</center>\n"
    . page_footer();

#[eof]
