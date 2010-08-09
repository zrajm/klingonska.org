#!/usr/bin/perl 
####################################################################
#  $VER: download.cgi V2.1, by Zrajm C Akfohg (2001-02-07)
#
#  This is the "Klingon Data Download" script, it requires the user
#  to input a word from TKD, before being able to access and download
#  several transcripts of canon Klingon sources.
#
# History:
#
# [1998-??-??] V1.0 - Working, but not neat version. Depending on cgi-lib.pl to
# do all the CGI-stuff.
#
# [2001-01-22] V2.0 - Completely rewritten, now uses CGI.pm (which wasn't
# invented back in 1998, but which I use in other scripts by now).
#
# [2001-02-07] V2.1 - Now accepts an argument in the form of "file=tkd-all".
# This argument is kept and upon answering it is the first file loaded (thus
# making it easy to link to a specific file, beyond the password protection).
#
# [2004-04-09] V2.1.1 - Bugfix. Word on page 58, was "mispronounced" now
# corrected to "category".
#
# [2009-04-13] adapted script for hcoop
#
# [2009-05-09] removed '">' exploit opportunity, added "use warnings" and "use
# strict"
#
# TODO
#   o test answer using "Digest::SHA1::sha1_base64(USER_INPUTTED);"

####################################################################
# Variables used:
#   question = question (0 to 10)
#   answer   = answer   (0 to 10)
#   file     = tkd, tkw, tkwe (sentences), kgt, ck, pk  
####################################################################

use utf8;
use warnings;
use strict;
use Digest::SHA1;
use CGI qw(:standard);
binmode(STDIN,  ":encoding(utf8)");
binmode(STDOUT, ":encoding(utf8)");

my $file     = param('file')     || "";                 # get from HTML form
my $ques     = param('question');                       #      - || -
my $answer   = param('answer')   || "";                 #      - || -
my $PLACE    = "http://" . 
    (exists($ENV{HTTP_HOST})   ? $ENV{HTTP_HOST} : "localhost") .
    (exists($ENV{REQUEST_URI}) ? $ENV{REQUEST_URI}:  ""); # script url
$PLACE    =~ s/(.*)[?].*/$1/;                        # remove any 'get' args

my $PREV     = param('prev');
if (not defined($PREV)) {
    $PREV =                                          # set PREVious url
	exists($ENV{"HTTP_REFERER"}) ? $ENV{"HTTP_REFERER"} : "";
#    $PREV =~ s/^http:\/\/.+?\/(.*)/\1/g;             # remove "http://.../"
}

# table of answers
my @answer =  qw( similar sentence  Occasionally earthworm    translation );
my @page   =  qw( 41      41        78           19           26          );
my @para   =  qw( 2       3         2            4            2           );
my @line   =  qw( 1       1         3            2            1           );
my @word   =  qw( 4       3         6            4            4           );
my @sha1   =  qw( r2LzAhBR+8lMo2NNL7IPJ971WFM
                          oX27mms/+Gmn/yjVf2HiEskNfbc
                                    zXkqbFloHg5QJrx2TX5prFTiad4
                                                 7Mufq7jLPox7ipKozDGZFj3l0Nk
                                                              79f9fylUcTwe5/rPl1D+U+jPWJw);
push @answer, qw( express indicate  monosyllabic construction combinations);
push @page,   qw( 36      35        32           31           30          );
push @para,   qw( 2       1         1            2            2           );
push @line,   qw( 1       1         1            1            1           );
push @word,   qw( 5       2         5            4            2           );
push @sha1,   qw( 88Yt5FWWL72s3fOEPe5ZFEd2gsE
                          9+2vMoLa+2CcfUIbeGSG8Sc3HnY
                                    L7aOPrqJcyiQ8mLRma+J9giax2I
                                                 U1rmeP0zyqIvM1ZnRHBnJK16p0w
                                                              dxXPMeNGyfESb8ItThPxx1dywo0);
push @answer, qw( ghuS    singular  conversation Inherently   accurately  );
push @page,   qw( 37      39        26           24           24          );
push @para,   qw( 1       1         4            3            6           );
push @line,   qw( 1       1         3            1            2           );
push @word,   qw( 3       2         2            1            8           );
push @sha1,   qw( dsiifTcSUJdVYieDwrkeXnq3SJM
                          CsqZW5Ot3uk0jc75AWwPliTfrjo
                                    eLb5RENOrBjhRiKVLhLjJVGxmXc
                                                 ng++9cFXKmrgqMueRS2Bxs3QZqY
                                                              ZZ5TdXwzlMuuW4kvY3GZ2gwdJ50);
push @answer, qw( tenses  happening superlative  convenience  category    );
push @page,   qw( 40      27        71           63           58          );
push @para,   qw( 2       4         2            4            2           );
push @line,   qw( 1       1         1            2            1           );
push @word,   qw( 5       7         4            8            5           );
push @sha1,   qw( TeSTY+sWi/F2HhY+UIyZkwV02sg% 
                          ykY6vM2Ah9S6KvbSrosJ5ACdDWo
                                    5+hkWGBpf9aqtWIaSkVsiHLJ7lo
                                                 8s3nuioYUTDqJwVpgyqD8LN4UNg
                                                              XMv5ycX8G8NN+COKlwlJaPOPUWU );



# table of sources
my @source_abbr = qw/tkd tkw kgt ck pk bop sarek ftg/; # listed in order
my %source_label = (
    tkd   => "1992 - The Klingon Dictionary (2nd ed.)",
    tkw   => "1996 - The Klingon Way",
    kgt   => "1997 - Klingon for the Galactic Traveler",
    ck    => "1992 - Conversational Klingon (Transcript)",
    pk    => "1993 - Power Klingon (Transcript)",
    bop   => "1998 - Bird of Prey Poster",
    sarek => "1995 - Sarek (Partial Transcript)",
    ftg   => "1997 - Federation Travel Guide (Partial Transcript)",
);
my %source_file = (
    tkd   => "1992-01-01-tkd.txt",
    tkw   => "1996-05-01-tkw.txt",
    kgt   => "1997-11-01-kgt.txt",
    ck    => "1992-10-01-ck.txt",
    pk    => "1993-10-01-pk.txt",
    bop   => "1998-11-01-bop.txt",
    sarek => "1995-02-01-sarek.txt",
    ftg   => "1997-07-01-ftg.txt",
);



print header(-charset=>'utf-8');                 # Content-type header
page_header();                                   # HTML page header

my $infile = "";
if (defined($file) and exists($source_file{$file})) {
    $infile = $source_file{$file};
}



####################################################################
## begin of debug code

## dump HTML form values
#print "file=",$file,"<BR>";
#print "question=",$ques,"<BR>";
#print "answer=",$answer,"<BR>";

## dump all environment variables (in a nice way)
#print "<TABLE CELLPADDING=0 CELLSPACING=0 BORDER=0>";
#foreach (sort keys %ENV) {
#    print "<TR><TD ALIGN=RIGHT>",$_,"<TD>&nbsp;=&nbsp;<TD>",$ENV{$_},"</TR>";
#}; print "</TABLE>";

## end of debug code
####################################################################

if (defined($ques) and $answer eq $answer[$ques] && $answer ne '') {    # correct answer
    print
	"<center>",
	start_form({-method=>"post", -action=>$PLACE}),
	hidden(prev     => $PREV),
	hidden(question => $ques),
	hidden(answer   => $answer),
	h3("Select a document:</h3>"),
	popup_menu("file", [ @source_abbr ], "tkd", \%source_label),
	" ",
	submit("", "Show"),
        end_form(),
	"</center>\n\n";
    if ($infile ne '') {                             # insert file
	include_file($infile);
    } else {
	print "<p align=\"center\">Please choose which transcript to view above.</p>\n";
    }
} else {
    my $subtitle = "";
    if (!defined($ques) or $ques eq '' or $ques >= scalar(@answer)) {   # no valid question?
	srand;                                       # ..seed random generator
	$ques = int(rand(scalar(@answer)));          # ..pick question
	$subtitle = "Authourization request.";
    } elsif ( $answer eq '' ) {                      # no answer
	$subtitle = "Empty answer, try again.";
    } else {                                         # wrong answer
	$subtitle = "Incorrect answer, try again.";
    }
    print "<H2>$subtitle</H2>\n";
    quest_form();
}
page_footer();                                       # page footer
exit 0;                                              # quit


sub page_header {
    print <<EOF;
<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 3.2//EN">
<html><head><title>Klingonska Akademien -&nbsp;Klingon Data Download.</title></head>
<body vlink="#777777" alink="#aaaaaa" link="#444444" text="#000000" bgcolor="#ffffff">

<!-- ==================== Adressinfo ==================== -->
<table border=0 cellpadding=0 cellspacing=0 width=100% align=center>
  <tr>
    <td align=left><i><font size=1><a href="mailto:webmaster\@klingonska.org">webmaster\@klingonska.org</a></font></i></td>
    <td align=right><i><font size=1><a href="$PLACE">$PLACE</a></font></i></td>
  </tr>
</table>

<!-- ==================== Titel ==================== -->
<p align=center><a href="$PREV"><img src="/pic/ka.gif" width="600" height="176" alt="Klingonska Akademien" border=0 vspace=5></a>

<h1 align=center>Klingon Data Download.</h1>

EOF
}


sub page_footer {                                    # HTML Footer
    print <<EOF;

<!-- ==================== Copyright ==================== -->
<p><center>
<table cellpadding=0 cellspacing=0 border=0>
  <tr><td valign=bottom colspan=3><hr noshade></td></tr>
  <tr>
    <td>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</td>
    <td align=center>
      <b>&copy;1998-2009, Copyright 
      <a href="mailto:zrajm\@klingonska.org">Zrajm C Akfohg</a>,
      <a href="http://www.klingonska.org/">Klingonska Akademien</a>,
      Uppsala.</b>
    </td>
    <td>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</td>
  </tr>
  <tr><td valign="top" colspan="3"><hr noshade></td></tr>
</table>
</center>

</body>
</html>
EOF
}


sub quest_form {                                     # HTML form
    print <<EOF;

<p align="justify">For copyright reasons you must own a copy of Marc Okrand\'s
book <i>The Klingon Dictionary</i> to access the information presented here. To
certify that this is the case, please enter the specified word from the main
text of the TKD below.

<center><form method="post">
<input type=hidden name="prev" value="$PREV">
<input type=hidden name="question" value="$ques">
<input type=hidden name="file" value="$file">

<h3>TKD, page $page[$ques], paragraph $para[$ques], line $line[$ques], word $word[$ques]:</h3>

<p><input name="answer" value="$answer">
<input type="submit" value="Submit">
</form></center>

<p align="justify">When counting paragraphs, skip the Klingon example phrases.
Hyphenated words are counted as one. Ending paragraphs at the top of a page are
counted, as well as half words in the beginning of a line. <i>Case counts</i>.
EOF
}


sub include_file {
    my ($file) = @_;
    open(my $in, "<:encoding(utf8)", "$infile") or do {
	print "<h2 align=\"center\"><i>File not found.</i></h2>\n\n";
	return "";
    };
    print <<EOF;
<p align="justify">Below transcript is in UTF-8 plain text format. To save it,
select "Save as..." (or similar) from the menu in your browser, and then remove
the HTML-code at the beginning and end of the file.

<hr noshade width=85% />

<!-- The 'less than' sign has been replaced with the HTML code "&lt;"
in the text below, this to avoid weird things from happening to it in
your browser. To restore this, simply do a 'search and replace' in your
favourite text editor. (If you instead cut and paste the text directly
from your browser window this most likely won\'t be a problem.) -->

<pre><!-- The text begins on the row below this. -->
EOF
    do {                                         # loop thru file
	read($in, my $row, 1024);                # read row
	$row =~ s/</&lt;/g;                      # change < to &lt;
	$row =~ s/>/&gt;/g;                      # change < to &lt;
	print $row;                              # output row
    } until eof($in);
    print "<!-- The text ends on the row above this. --></pre>\n";
    return 1;
}

sub inc_counter {
    # Load inc and save counter
    open(FILE,"<count.$infile");
    flock (FILE, 2);
    my $count = <FILE>;
    flock (FILE, 8);
    close(FILE);
    $count++;
    open(FILE,">count.$infile"); 
    flock (FILE, 2); 
    print FILE "$count"; 
    flock (FILE, 8); 
    close(FILE); 
}

__END__
