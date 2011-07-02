#!/usr/bin/perl -w
#
# [2002-01-06, 22.29-23.28]
# [2002-01-20,~19.05-20.14]
# [2003-01-05, 01.58-02.21]
#
# [2009-04-10, 01:30-03:26] Adapted script for new hcoop hosting of site.
#
# Translate romanized Klingon into HTML-pages with inlined pIqaD images.

# alphabet translation table
# (intended to translate from text to pIqaD-gifs, right
# now it justs translates from romanized into KLIpIqaDmey
# typeface encoding)
# This could be done more nicely using here-documents or
# custom data files (should be used to convert any text into
# HTML with any of the inline pIqaD-gifs). Which of the pIqaDs
# should be selectable from the form.


use utf8;
use CGI qw(:standard);
binmode(STDIN,  ":encoding(utf8)");
binmode(STDOUT, ":encoding(utf8)");


sub klinprint {
    my @text = @_;
    foreach (@text) {
        s/($find_chars)/$alphabet{$1}/ge;          # translate alphabet
    }
    return @text;
}


sub alphainit {
%alphabet = (
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
    "'" => '<img src="/piq/bg1/z.gif" width=10 height=39 alt="'."'".'">',
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
); #'
}




sub html_encode {
    %char=( "&"=>"&amp;", '"'=>"&quot;", "<"=>"&lt;", ">"=>"&gt;", "\n"=>"<br>");
    local @x = @_;
    foreach (@x) {
	s#([\"<>&])#$char{$1}#ge; # encode it with `%HX' notation
    }
    return $x[0] if $#x == 0;
    return @x;
}


sub html_header {
    my $link = !$query{info} ? "/" : do {
	(my $form_name = $0) =~ s/^.*\///;
	$form_name;
    };


    return <<"EOF";
<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.0 Transitional//EN">
<HTML><HEAD><TITLE>The pIqaD Playground &ndash; Klingonska Akademien</TITLE>
<link rel="stylesheet" type="text/css" href="../includes/pagestats.css" />
</HEAD>
<BODY VLINK="#777777" ALINK="#AAAAAA" LINK="#444444" TEXT="#000000" BGCOLOR="#FFFFFF">

<!-- begin:status -->
<div id="pagestats">
  <span id="crumbs">
    <a href="http://klingonska.org/">Home</a> &gt;
    <a href="http://klingonska.org/piqad/">pIqaD, And How to Read It</a> &gt;
    <a href="http://klingonska.org/piqad/play.cgi">The pIqaD Playground</a>
  </span>
  <span id="pubdate">
    Updated <time pubdate datetime="2007-08-17T02:53">August 17, 2007</time>
  </span>
</div>
<!-- end:status -->

<!-- ==================== KA-logo ==================== -->
<p align=center><a href="$link"><img src="/pic/ka.gif" width="600" height="176" alt="klingonska akademien" border=0 vspace=5></a></p>

<h1 align=center>The <b>pIqaD</b> Playground</h1>
EOF
}

sub html_form {
    my %query = @_;
    (my $form_name = $0) =~ s/^.*\///;
    return <<"EOF";
<p><form action="$form_name" method=post>
Write something in Klingon to see it written in <b>pIqaD</b>.
<br><textarea name=text rows=11 cols=40>$query{text}</textarea>
<br>
  <input type="submit" value="Show">
  <input type="submit" value="Hide form" name="hide">
  <input type="submit" value="Help"       name="info">
</form>
EOF
}

sub html_footer {
    return <<"EOF";
<!-- ==================== Copyright ==================== -->
<P><CENTER><TABLE CELLPADDING=0 CELLSPACING=0 BORDER=0>
  <TR><TD VALIGN=BOTTOM COLSPAN=3><HR NOSHADE></TD></TR>
  <TR><TD>         </TD><TD ALIGN=CENTER><B>©2000&ndash;2009, Copyright <A HREF="mailto:zrajm\@klingonska.org">Zrajm C Akfohg</A>,
    <A HREF="http://klingonska.org/">Klingonska Akademien</A>, Uppsala.</B></TD>
    <TD>         </TD></TR>
  <TR><TD VALIGN=TOP COLSPAN=3><HR NOSHADE></TD></TR>
</TABLE></CENTER>
</BODY></HTML>
EOF
}

# output content-type header
# (when used as SSI or loaded explicitly by
# browser, but not when called by other script)
if (not $ENV{X_CGI}) {                         # if not suppressed
    print header(-charset=>'utf-8');           #   Content-type header
    $ENV{X_CGI} = "perl";                      #   and suppress it from now on
}                                              #
&alphainit();                                  # init alhphabet
my $query;
foreach $i (param()) {                        # read form parameters
    $query{$i} = param("$i");                 #   into query hash
}                                              #

################################################
## set some environment variables used by      #
## head & foot CGIs                            #
#my $path = "$ENV{DOCUMENT_ROOT}";              # path
#($Action_URL = $0) =~ s/^$path//;              # url for form to point to
$ENV{"X_TITLE"} = "The <b>pIqaD</b> Playground.";
$ENV{"X_YEAR"}  = "2000-2003";                 # year
$ENV{"X_PREV"}  = "/";                         # url of prev page
$ENV{"X_LANG"}  = "en";                        # language
$ENV{"X_PREV"}  = "$ENV{SCRIPT_NAME}",         #
    if ($query{info});


## make a search pattern for above alphabet translation
$find_chars = join "|", map {
    quotemeta;
} sort { length($b) <=> length($a) } keys %alphabet;


print html_header();                            ## page header
if ($query{info}) {
    print <<"EOF";

<p>These are the characters available in <i>The <b>pIqaD</b> Playground</i>.
Write normal good, honest case-sensetive Klingon and everything will be fine.
In addition to this you may use <i>&lt;</i> for the symbol of the Klingon
Empire, <i>&gt;</i> for the logo of <i>Klingonska Akademien</i> and <i>#</i>
for an older symbol for the Klingon Empire from one of KLI\'s
typefaces. Non-Klingon letters are not translated.

<br>     In case you have your doubt regarding the punctuation marks, I just
want to add that they originate from the SkyBox Cards. If you still don\'t like
them, why not use <b>DloraH</b>\'s preferred method of punctuation - multiple
spaces for longer pauses. (Multiple spaces <i>does not</i> collapse into a
single one on this page.)


<p><table border=0 width="80%" align=center>
  <tr align=center>
    <td><img src="/piq/bg1/a.gif" width="38" height="39" alt="a"></td>
    <td><img src="/piq/bg1/b.gif" width="37" height="39" alt="b"></td>
    <td><img src="/piq/bg1/ch.gif" width="42" height="39" alt="ch"></td>
    <td><img src="/piq/bg1/d.gif" width="29" height="39" alt="D"></td>
    <td><img src="/piq/bg1/e.gif" width="26" height="39" alt="e"></td>
    <td><img src="/piq/bg1/gh.gif" width="43" height="39" alt="gh"></td>
    <td><img src="/piq/bg1/h.gif" width="21" height="39" alt="H"></td>
    <td><img src="/piq/bg1/i.gif" width="31" height="39" alt="I"></td>
    <td><img src="/piq/bg1/j.gif" width="36" height="39" alt="j"></td>
  </tr><tr align=center>
    <td><b>a</b></td>
    <td><b>b</b></td>
    <td><b>ch</b></td>
    <td><b>D</b></td>
    <td><b>e</b></td>
    <td><b>gh</b></td>
    <td><b>H</b></td>
    <td><b>I</b></td>
    <td><b>j</b></td>
  </tr><tr align=center>
    <td><img src="/piq/bg1/l.gif" width="28" height="39" alt="l"></td>
    <td><img src="/piq/bg1/m.gif" width="27" height="39" alt="m"></td>
    <td><img src="/piq/bg1/n.gif" width="33" height="39" alt="n"></td>
    <td><img src="/piq/bg1/ng.gif" width="41" height="39" alt="ng"></td>
    <td><img src="/piq/bg1/o.gif" width="36" height="39" alt="o"></td>
    <td><img src="/piq/bg1/p.gif" width="26" height="39" alt="p"></td>
    <td><img src="/piq/bg1/q.gif" width="18" height="39" alt="q"></td>
    <td><img src="/piq/bg1/qh.gif" width="27" height="39" alt="Q"></td>
    <td><img src="/piq/bg1/r.gif" width="33" height="39" alt="r"></td>
  </tr><tr align=center>
    <td><b>l</b></td>
    <td><b>m</b></td>
    <td><b>n</b></td>
    <td><b>ng</b></td>
    <td><b>o</b></td>
    <td><b>p</b></td>
    <td><b>q</b></td>
    <td><b>Q</b></td>
    <td><b>r</b></td>
  </tr><tr align=center>
    <td><img src="/piq/bg1/s.gif" width="39" height="39" alt="S"></td>
    <td><img src="/piq/bg1/t.gif" width="36" height="39" alt="t"></td>
    <td><img src="/piq/bg1/tlh.gif" width="35" height="39" alt="tlh"></td>
    <td><img src="/piq/bg1/u.gif" width="38" height="39" alt="u"></td>
    <td><img src="/piq/bg1/v.gif" width="44" height="39" alt="v"></td>
    <td><img src="/piq/bg1/w.gif" width="34" height="39" alt="w"></td>
    <td><img src="/piq/bg1/y.gif" width="35" height="39" alt="y"></td>
    <td><img src="/piq/bg1/z.gif" width="10" height="39" alt="'"></td>
    <td><img src="/piq/bg1/_space.gif" width=27 height=39 alt="_"></td>
  </tr><tr align=center>
    <td><b>S</b></td>
    <td><b>t</b></td>
    <td><b>tlh</b></td>
    <td><b>u</b></td>
    <td><b>v</b></td>
    <td><b>w</b></td>
    <td><b>y</b></td>
    <td><b>'</b></td>
    <td><FONT SIZE=1>space</FONT></td>
  </tr>
  <tr><td colspan=9 height=35></td></tr>
  <tr align=center>
    <td></td>
    <td></td>
    <td><img src="/piq/bg1/0.gif" width="30" height="39" alt="0"></td>
    <td><img src="/piq/bg1/1.gif" width="36" height="39" alt="1"></td>
    <td><img src="/piq/bg1/2.gif" width="17" height="39" alt="2"></td>
    <td><img src="/piq/bg1/3.gif" width="26" height="39" alt="3"></td>
    <td><img src="/piq/bg1/4.gif" width="34" height="39" alt="4"></td>
  </tr><tr align=center>
    <td></td>
    <td></td>
    <td><b>0</b></td>
    <td><b>1</b></td>
    <td><b>2</b></td>
    <td><b>3</b></td>
    <td><b>4</b></td>
  </tr><tr align=center>
    <td></td>
    <td></td>
    <td><img src="/piq/bg1/5.gif" width="20" height="39" alt="5"></td>
    <td><img src="/piq/bg1/6.gif" width="35" height="39" alt="6"></td>
    <td><img src="/piq/bg1/7.gif" width="28" height="39" alt="7"></td>
    <td><img src="/piq/bg1/8.gif" width="37" height="39" alt="8"></td>
    <td><img src="/piq/bg1/9.gif" width="27" height="39" alt="9"></td>
  </tr><tr align=center>
    <td></td>
    <td></td>
    <td><b>5</b></td>
    <td><b>6</b></td>
    <td><b>7</b></td>
    <td><b>8</b></td>
    <td><b>9</b></td>
  </tr><tr align=center>
    <td></td>
    <td></td>
    <td><img src="/piq/bg1/_half.gif" width="25" height="39" alt=",;:"></td>
    <td><img src="/piq/bg1/_full.gif" width="25" height="39" alt=".?!"></td>
    <td><img src="/piq/bg1/_empire.gif" width=39 height=39 alt="¶"></td>
    <td><img src="/piq/bg1/_empire2.gif" width=32 height=39 alt="¶"></td>
    <td><img src="/piq/bg1/_ka.gif" width=44 height=39 alt="¶"></td>
  </tr><tr align=center>
    <td></td>
    <td></td>
    <td><b>,;:</b></td>
    <td><b>.?!</b></td>
    <td>(#)</td>
    <td>(&lt;)</td>
    <td>(&gt;)</td>
  </tr>
</table>

<p>If you want to know more about the Klingon writing system, you may want to
take a look at the article <i><a href="./"><b>pIqaD</b>, and How To Read
It</a></i>. For a glimpse of Klingon handwriting, take a look at <i><a
href="../piqadpic.html">Some Pictures of <b>pIqaD</b></a></i>. If you\'re
interested in the (GIF-)typeface used above, take a look at <i><a
href="../piq/">Some Klingon GIF Fonts</a></i>.

<br>     Sometime in the (not-so-far) future I hope to add more typefaces
to this page. I already have my own handwriting, and Mark Shoulsson\'s
handwriting as GIF typefaces, as well a as the IPA characters needed to
transcribe Klingon.

EOF
    # ' (syntax hilite fix)
    print html_footer();
    exit;
}


$query{text} = <<"EOF" unless %query;
yIjatlh SoHvaD jIjatlh.
bItam.
yIjatlh jIjach.
bItamqu'.
yIjatlh jItlhup.
'ach not bI'Ij. bItam.
reH bItam.

< qonta' maHvatlh >
EOF


print "<center>\n\n";
print html_form(%query) unless $query{hide};
print "<p>", klinprint($query{text}), "</p>";
print "</center>\n";
print html_footer();                            ## page footer
##################################################


