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
#  [1998-??-??] V1.0 - Working, but not neat version. Depending on
#    cgi-lib.pl to do all the CGI-stuff.
#  [2001-01-22] V2.0 - Completely rewritten, now uses CGI.pm (which
#    wasn't invented back in 1998, but which I use in other scripts
#    by now).
#  [2001-02-07] V2.1 - Now accepts an argument in the form of
#    "file=tkd-all". This argument is kept and upon answering it is
#    the first file loaded (thus making it easy to link to a specific
#    file, beyond the password protection).
#  [2004-04-09] V2.1.1 - Bugfix. Word on page 58, was "mispronounced" now
#    corrected to "category".
#
# To Do:
#   o Add support for frames.
#
# Variables used:
#   question = question (0 to 10)
#   answer   = answer   (0 to 10)
#   file     = tkd, tkw, tkwe (sentences), kgt, ck, pk  
#
# Table of Answers:
#   Q  PAGE     PARAGRAPH    LINE    WORD    ANSWER
#   0  Page 41, paragraph 2, line 1, word 4  similar
#   1  Page 41, paragraph 3, line 1, word 3  sentence
#   2  Page 40, paragraph 2, line 1, word 5  tenses
#   3  Page 39, paragraph 1, line 1, word 2  singular
#   4  Page 37, paragraph 1, line 1, word 3  ghuS
#   5  Page 36, paragraph 2, line 1, word 5  express
#   6  Page 35, paragraph 1, line 1, word 2  indicate
#   7  Page 32, paragraph 1, line 1, word 5  monosyllabic
#   8  Page 31, paragraph 2, line 1, word 4  construction
#   9  Page 30, paragraph 2, line 1, word 2  combinations
#  10  Page 27, paragraph 4, line 1, word 7  happening
#  11  Page 26, paragraph 2, line 1, word 4  translation
#  12  Page 26, paragraph 4, line 3, word 2  conversation
#  13  Page 24, paragraph 3, line 1, word 1  Inherently
#  14  Page 24, paragraph 6, line 2, word 8  accurately
#  15  Page 19, paragraph 4, line 2, word 4  earthworm
#  16  Page 78, paragraph 2, line 3, word 6  Occasionally
#  17  Page 71, paragraph 2, line 1, word 4  superlative
#  18  Page 63, paragraph 4, line 2, word 8  convenience
#  19  Page 58, paragraph 2, line 1, word 5  category
#
####################################################################

use utf8;
binmode(STDIN,  ":encoding(utf8)");
binmode(STDOUT, ":encoding(utf8)");


use CGI qw(:standard);                               # use CGI.pm

$dir      = '';                                      # directory setting
$file     = param('file');                           # get from HTML form
$ques     = param('question');                       #      - || -
$answer   = param('answer');                         #      - || -
$PLACE    = "http://" . $ENV{"HTTP_HOST"} . $ENV{"REQUEST_URI"}; # script url
$PLACE    =~ s/(.*)[?].*/\1/;                        # remove any 'get' args

$PREV     = param('prev');
if ($PREV eq '') {
    $PREV = $ENV{"HTTP_REFERER"};                    # set PREVious url
#    $PREV =~ s/^http:\/\/.+?\/(.*)/\1/g;             # remove "http://.../"
}




# table of answers
@answer =     qw( similar sentence  Occasionally earthworm    translation );
@page   =     qw( 41      41        78           19           26          );
@para   =     qw( 2       3         2            4            2           );
@line   =     qw( 1       1         3            2            1           );
@word   =     qw( 4       3         6            4            4           );
push @answer, qw( express indicate  monosyllabic construction combinations);
push @page,   qw( 36      35        32           31           30          );
push @para,   qw( 2       1         1            2            2           );
push @line,   qw( 1       1         1            1            1           );
push @word,   qw( 5       2         5            4            2           );
push @answer, qw( ghuS    singular  conversation Inherently   accurately  );
push @page,   qw( 37      39        26           24           24          );
push @para,   qw( 1       1         4            3            6           );
push @line,   qw( 1       1         3            1            2           );
push @word,   qw( 3       2         2            1            8           );
push @answer, qw( tenses  happening superlative  convenience  category    );
push @page,   qw( 40      27        71           63           58          );
push @para,   qw( 2       4         2            4            2           );
push @line,   qw( 1       1         1            2            1           );
push @word,   qw( 5       7         4            8            5           );


## table of files
#%filename = (
#    "tkd-dict"     => "wTKD"
#    "tkd-examples" => "eTKD"
#    "tkd-all"      => "tTKD"
#    "tkw-words"    => "wTKW"
#    "tkw-examples" => "eTKW"
#    "kgt-dict"     => "wKGT"
#    "kgt-examples" => "eKGT"
#    "ck-all"       => "tCK"
#    "pk-all"       => "tPK"
#    "sbx-all"      => "tSBX"
#);

if ($file ne '') {                               # set filename
    if    ($file eq 'tkd-dict')     { $infile = 'wTKD' }
    elsif ($file eq 'tkd-examples') { $infile = 'eTKD' }
    elsif ($file eq 'tkd-all')      { $infile = 'tTKD' }
    elsif ($file eq 'tkw-words')    { $infile = 'wTKW' }
    elsif ($file eq 'tkw-examples') { $infile = 'eTKW' }
    elsif ($file eq 'kgt-dict')     { $infile = 'wKGT' }
    elsif ($file eq 'kgt-examples') { $infile = 'eKGT' }
    elsif ($file eq 'ck-all')       { $infile = 'tCK'  }
    elsif ($file eq 'pk-all')       { $infile = 'tPK'  }
    elsif ($file eq 'sbx-all')      { $infile = 'tSBX' }
    if ($infile ne '') { $infile = $dir . $infile . '.txt' }
}

print header(-charset=>'utf-8');                     # Content-type header
&page_header;                                        # HTML page header

#print "file=",$file,"<br>\n";
#print "infile=",$infile,"<br>\n";




####################################################################
## begin of debug code

## dump HTML form values
#print "file=",$file,"<BR>";
#print "question=",$ques,"<BR>";
#print "answer=",$answer,"<BR>";

## dump all environment variables (in a nice way)
#print "<TABLE CELLPADDING=0 CELLSPACING=0 BORDER=0>";
#foreach (sort keys %ENV) {
#    print "<TR><TD ALIGN=RIGHT>",$_,"<TD> = <TD>",$ENV{$_},"</TR>";
#}; print "</TABLE>";

## end of debug code
####################################################################

if ($answer eq $answer[$ques] && $answer ne '') {    # correct answer
    print "<CENTER><FORM ACTION=$PLACE METHOD=\"POST\">\n";        # keep data as hidden
    print "<INPUT TYPE=HIDDEN NAME=\"prev\" VALUE=\"$PREV\">\n";
    print "<INPUT TYPE=HIDDEN NAME=\"question\" VALUE=$ques>\n";
    print "<INPUT TYPE=HIDDEN NAME=\"answer\" VALUE=\"$answer\">\n\n";
    print "<H3>Select a document:</H3>\n\n";
    &file_selector;                                  # FORM file-selector
    print "<INPUT TYPE=SUBMIT VALUE=\"Load\">\n";    # Submit-knapp
    print "</FORM></CENTER>\n\n";
    if ($infile ne '') {                             # insert file
	print <<eop;
<P ALIGN=JUSTIFY>The file displayed below is in plain text format
(using the UTF-8 character set if you want to become all technical
about it) and was specifically written with reference purposes in mind.
If you want a copy of it you may either copy and paste it into your
favourite editor or word processor, or you may select "Save as..." (or
something similar) in your browser, and then manually remove the HTML-code
at the beginning and end of the file.

<HR NOSHADE WIDTH=85%>

<!-- The 'less than' sign has been replaced with the HTML code "&lt;"
in the text below, this to avoid weird things from happening to it in
your browser. To restore this, simply do a 'search and replace' in your
favourite text editor. (If you instead cut and paste the text directly
from your browser window this most likely won\'t be a problem.) -->

<PRE><!-- The text begins on the row below this. -->
eop
        open(infile, "<:encoding(utf8)", "$infile"); # open file
	do {                                         # loop thru file
	    read(infile,$row,1024);                  # read row
	    $row =~ s/</&lt;/g;                      # change < to &lt;
	    $row =~ s/>/&gt;/g;                      # change < to &lt;
	    print $row;                              # output row
	} until eof(infile);
	print "<!-- The text ends on the row above this. --></PRE>\n";
    }
} else {
    if ($ques eq '' || $ques >= scalar(@answer)) {   # no valid question?
	srand;                                       # ..seed random generator
	$ques = int(rand(scalar(@answer)));          # ..pick question
	$subtitle = "Authourization request.";
    } elsif ( $answer eq '' ) {                      # no answer
	$subtitle = "Empty answer, try again.";
    } else {                                         # wrong answer
	$subtitle = "Incorrect answer, try again.";
    }
    print "<H2>$subtitle</H2>\n";
    &quest_form;
}
&page_footer;                                        # page footer
exit 0;                                              # quit


sub page_header {
    print <<eop;
<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 3.2//EN">
<HTML><HEAD><TITLE>Klingonska Akademien - Klingon Data Download.</TITLE></HEAD>
<BODY VLINK="#777777" ALINK="#AAAAAA" LINK="#444444" TEXT="#000000" BGCOLOR="#FFFFFF">

<!-- ==================== Adressinfo ==================== -->
<TABLE BORDER=0 CELLPADDING=0 CELLSPACING=0 WIDTH=100% ALIGN=CENTER>
  <TR>
    <TD ALIGN=LEFT><I><FONT SIZE=1><A HREF="mailto:webmaster\@klingonska.org">webmaster\@klingonska.org</A></FONT></I></TD>
    <TD ALIGN=RIGHT><I><FONT SIZE=1><A HREF="$PLACE">$PLACE</A></FONT></I></TD>
  </TR>
</TABLE>

<!-- ==================== Titel ==================== -->
<P ALIGN=CENTER><A HREF="$PREV"><IMG SRC="/pic/ka.gif" WIDTH="600" HEIGHT="176" ALT="Klingonska Akademien" BORDER=0 VSPACE=5></A>

<H1 ALIGN=CENTER>Klingon Data Download.</H1>

eop
}

sub page_footer {                                    # HTML Footer
    print <<eop;

<!-- ==================== Copyright ==================== -->
<P><CENTER>
<TABLE CELLPADDING=0 CELLSPACING=0 BORDER=0>
  <TR><TD VALIGN=BOTTOM COLSPAN=3><HR NOSHADE></TD></TR>
  <TR>
    <TD>         </TD>
    <TD ALIGN=CENTER>
      <B>©1998-2001, Copyright 
      <A HREF="mailto:zrajm\@klingonska.org">Zrajm C Akfohg</A>,
      <A HREF="http://www.klingonska.org/">Klingonska Akademien</A>,
      Uppsala.</B>
    </TD>
    <TD>         </TD>
  </TR>
  <TR><TD VALIGN=TOP COLSPAN=3><HR NOSHADE></TD></TR>
</TABLE>
</CENTER>

</BODY>
</HTML>
eop
}

sub quest_form {                                     # HTML form
    print <<eop;

<P ALIGN=JUSTIFY>For copyright reasons you must own a copy of Marc
Okrand\'s book <I>The Klingon Dictionary</I> to access the information
presented here. To certify that this is the case, please enter the
specified word from the main text of the TKD below.

<CENTER><FORM METHOD="POST">
<INPUT TYPE=HIDDEN NAME="prev" VALUE="$PREV">
<INPUT TYPE=HIDDEN NAME="question" VALUE=$ques>
<INPUT TYPE=HIDDEN NAME="file" VALUE="$file">

<H3>TKD, page $page[$ques], paragraph $para[$ques], line $line[$ques], word $word[$ques]:</H3>

<P><INPUT NAME="answer" VALUE="$answer">
<INPUT TYPE="submit" VALUE="Access">
</FORM></CENTER>

<P ALIGN=JUSTIFY>When counting paragraphs, skip the Klingon example
phrases. Hyphenated words are counted as one. Ending paragraphs at the
top of a page are counted, as well as half words in the beginning of a
line. <I>Case counts</I>.
eop
}


sub file_selector {
    print '<SELECT NAME="file">',"\n";
    print '<OPTION VALUE="tkd-all"',($file eq 'tkd-all') ? ' SELECTED' : '','>TKD (Complete transcript)',"\n";
    print '<OPTION VALUE="tkd-dict"',($file eq 'tkd-dict') ? ' SELECTED' : '','>TKD (Dictionary part)',"\n";
    print '<OPTION VALUE="tkd-examples"',($file eq 'tkd-examples') ? ' SELECTED' : '','>TKD (Klingon phrases)',"\n";
    print '<OPTION VALUE="tkw-words"',($file eq 'tkw-words') ? ' SELECTED' : '','>TKW (All Klingon words)',"\n";
    print '<OPTION VALUE="tkw-examples"',($file eq 'tkw-examples') ? ' SELECTED' : '','>TKW (Klingon phrases)',"\n";
    print '<OPTION VALUE="kgt-dict"',($file eq 'kgt-dict') ? ' SELECTED' : '','>KGT (Dictionary part)',"\n";
    print '<OPTION VALUE="kgt-examples"',($file eq 'kgt-examples') ? ' SELECTED' : '','>KGT (Most example phrases)',"\n";
    print '<OPTION VALUE="ck-all"',($file eq 'ck-all') ? ' SELECTED' : '','>CK (Complete transcript)',"\n";
    print '<OPTION VALUE="pk-all"',($file eq 'pk-all') ? ' SELECTED' : '','>PK (Complete transcript)',"\n";
    print '<OPTION VALUE="sbx-all"',($file eq 'sbx-all') ? ' SELECTED' : '','>SBX (Complete transcript)',"\n";
    print "</SELECT>\n";
}


sub inc_counter {
# Load inc and save counter
    open(FILE,"<count.$infile");
    flock (FILE, 2);
    $count = <FILE>;
    flock (FILE, 8);
    close(FILE);
    $count++;
    open(FILE,">count.$infile"); 
    flock (FILE, 2); 
    print FILE "$count"; 
    flock (FILE, 8); 
    close(FILE); 
}
