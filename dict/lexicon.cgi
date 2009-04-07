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


###############################################################################
##                                                                           ##
##  Initializations                                                          ##
##                                                                           ##
###############################################################################

use utf8;
binmode(STDIN,  ":encoding(utf8)");
binmode(STDOUT, ":encoding(utf8)");

# output content-type header
# (when used as SSI or loaded explicitly by
# browser, but not when called by other script)
if (not $ENV{X_CGI}) {                         # if not suppressed
    print header(-charset=>'utf-8');                     # Content-type header
    $ENV{X_CGI} = "perl";                      #   and suppress it from now on
}                                              #

# language (en=english/sv=swedish)
my $lang = lc ($ENV{LANG} || $ENV{X_LANG});    # get language
$lang = $lang eq "sve" ? "sv" :                #
        $lang eq "eng" ? "en" : $lang;         #
$lang = "en" unless $lang =~ /^(en|sv)$/;      #



################################################################################
###                                                                           ##
###  Subroutines                                                              ##
###                                                                           ##
################################################################################


sub print_buffer(@) {
    foreach (@buf) {                           # output result (in this post)
        ($field, $cont) = m/^([^:]+):\s+(.*)/; # field name & cont
        $cont =~ s/([<>«»])//g;                # remove <>«»
        $cont =~ s#([{}])#($1 eq "{"?"<b>":"</b>")#ge;  # boldify
        $cont =~ s#~(.*?)~#<i>$1</i>#g;        # apply italics
        $cont =~ s#(.*)¿\?(.*)#$1$2 (uncertain translation)#g; #
        if ($field eq "tlh") {                 #
            print "  <tr><td colspan=3><hr noshade></td></tr>";
            print "  <tr>\n";                  #
            print "    <td>$matches. </td>\n"; #
            print "  <th align=left>$fieldnames{$field}: </th>\n";
            print "<td>$cont</td>\n";          #
        } elsif ($field ne "data") {           #
            print "<tr valign=top>\n";         #
            print "    <td></td>\n";           #
            print "  <th align=left>$fieldnames{$field}: </th>\n";
            print "<td>$cont</td>\n";          #
        }                                      #
    }                                          #
}

sub in_buffer($@) {
    my ($query, @buf) = @_;                    # get args
    foreach (@buf) {                           # search in buffer
        return 1                               # return "success"
            if /$query/o;                      #   if current row contains
    }                                          #   the sought for string
    return 0;                                  # otherwise: "false"
}

sub html_head {
return <<"EOF";
<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 3.2//EN">
<HTML><HEAD><TITLE>Klingon Pocket Dictionary: Lexicon.</TITLE></HEAD>
<BODY VLINK="#777777" ALINK="#AAAAAA" LINK="#444444" TEXT="#000000" BGCOLOR="#FFFFFF">


<TABLE BORDER=0 CELLPADDING=1 CELLSPACING=0 WIDTH="100%">
<TR><TD VALIGN=TOP>


<!-- ==================== Title. ==================== -->
<center>
<a href="../"><img src="pic/title.gif" width="400" height="166" alt="tlhIngan Hol mu'ghom mach" border=0></a>
<h1>Klingon Pocket Dictionary: Lexicon</h1>
<p>
  <table align=center bgcolor="#BBBBBB" cellpadding=5>
    <tr>
      <td align=center><b>Some info and a searchable version of the pocket
        dictionary database.</b></td>
    </tr>
  </table> 
</center>

EOF
}

sub html_form {
    my @checked=();
    $checked[0]=" checked" if $form_field eq "tlh";
    $checked[1]=" checked" if $form_field eq "en";
    $checked[2]=" checked" if $form_field eq "sv";
    $checked[3]=" checked" if $form_field eq "all";
    return <<"!";
<form action="lexicon.cgi">
  <table border=0 cellpadding=0 cellspacing=0>
    <tr align=center>
      <td>
        <input type=text   value="$form_query" name=query size=30>
        <input type=submit value="Search">
      </td>
    </tr>
    <tr align=center>
      <td><font size=2><b>Search in:</b> 
        <input name=field type=radio value="tlh"$checked[0]>Klingon 
        <input name=field type=radio value="en"$checked[1]>English 
        <input name=field type=radio value="sv"$checked[2]>Swedish 
        <input name=field type=radio value="all"$checked[3]>All data
        </font>
      </td>
    </tr>
  </table>
</form>
!
}


sub html_foot {
return <<"EOF";

<!-- ==================== Copyright ==================== -->
<P><CENTER><TABLE CELLPADDING=0 CELLSPACING=0 BORDER=0>
  <TR>
    <TD VALIGN=BOTTOM COLSPAN=3><HR NOSHADE></TD>
  </TR>
  <TR>
    <TD>         </TD>
    <TD ALIGN=CENTER><B>©1998&ndash;2009, Copyright 
      <A HREF="mailto:mp@klingonska.org">Markus Persson</A> & 
      <A HREF="mailto:zrajm@klingonska.org">Zrajm C Akfohg</A>, 
      <A HREF="http://www.klingonska.org/">Klingonska Akademien</A>, Uppsala.</B></TD>
    <TD>         </TD>
  </TR>
  <TR>
    <TD VALIGN=TOP COLSPAN=3><HR NOSHADE></TD>
  </TR>
</TABLE>


<!-- ================== Feedback Form ================== -->
<!-- [2007-07-15] Below stuff disabled in move to ManuFrog -->
<!-- (remove spaces before "#" to re-enable) -->
<!-- #include virtual="/feedback.cgi"
--><!-- #if expr="!$X_NOLOG"
  --><!-- #include virtual="/.log.cgi"
--><!-- #endif -->
</CENTER>
</BODY>
</HTML>

</TD>



<!-- ==================== Navigation flaps ==================== -->
<TD VALIGN=TOP><TABLE CELLSPACING=2 CELLPADDING=0>
  <tr><td><A HREF="./"               ><IMG
    SRC="pic/about.gif"   WIDTH=21 HEIGHT=65  ALT="About"            BORDER=2></A></TD>
  </TR><tr><td><A HREF="intro.html"  ><IMG
    SRC="pic/intro.gif"   WIDTH=21 HEIGHT=124 ALT="Introduction"     BORDER=2></A></TD>
  </TR><TR><TD                       ><IMG
    SRC="pic/lexicon.gif" WIDTH=21 HEIGHT=84  ALT="Lexicon"          BORDER=0></TD>
  </TR><tr><td><A HREF="suffix.html"><IMG
    SRC="pic/suffix.gif"  WIDTH=21 HEIGHT=128 ALT="Suffix Guide"     BORDER=2></A></TD>
  </TR><TR><TD><A HREF="tables.html" ><IMG
    SRC="pic/tables.gif"  WIDTH=21 HEIGHT=180 ALT="Reference Tables" BORDER=2></A></TD>
  </TR>
</TABLE></TD></TR></TABLE>
</BODY></HTML>
EOF
}



###############################################################################
##                                                                           ##
##  Older, non-cleaned up code                                               ##
##                                                                           ##
###############################################################################


use CGI qw(:standard);                         # use CGI.pm
use Encode 'decode';

$ENV{X_TITLE}   = "Lexicon.";
$ENV{X_YEAR}    = "1998-2003";
$ENV{X_LANG}    = "en";
$ENV{X_THEME}   = "paqHom";
$ENV{X_SUMMARY} = <<"!";

    The dictionary parts (Klingon&ndash;English / English&ndash;Klingon) of in the
    <i>Klingon Pocket Dictionary</i> are automatically extracted from a
    database, which has been continuously updated and improved since it was
    created in late 1997. You may use the below form to search that database.

!


# read HTML form values
foreach $x (qw(query field)) {                 # get FORM values:
    ${"form_$x"} = decode("UTF-8", param($x)); # "$form_query" & "$form_field"
}; $query = quotemeta $form_query;             # quote metachars

$form_field="tlh" if $form_field eq "";

print html_head();

print "\n<p><center>\n";

print html_form();
print "</center>\n\n";

%fieldnames = (
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


for ($form_field) {
    $query="^tlh:.*?$query",    last if /^tlh$/;  # klingon search
    $query="^en:.*?(?i)$query", last if /^en$/;   # english search
    $query="^sv:.*?(?i)$query", last if /^sv$/;   # swedish search
    $query="^[^:]*:.*?(?i)$query";                # search all fields
}






if ($form_query ne "") {
    @buf     = ();                                 # clear buffer
    $matches = 0;                                  # clear no of matches
    print "<p><table align=center border=0 cellpadding=0 cellspacing=0>\n";
    print "<tr><td colspan=3>You searched for »$form_query« ";
    print "in all $fieldnames{$form_field} fields.";
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
                    print_buffer(@buf);        # output buffer
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
    if ($matches == 0) {
	print "<tr><td colspan=3><hr noshade></td></tr>\n";
	print "<tr><td colspan=3>There were no matches.</td></tr>\n";
    }
    close DICT;
    print "<tr><td colspan=3><hr noshade></td></tr>";
    print "<tr><td colspan=3>$matches match".($match==1?"":"es").".</td></tr>";
    print "</table>\n";
} else {
print <<"!";

<p align=justify>The book has both a Klingon&ndash;English, and an English&ndash;Klingon
wordlist. These wordlists are automatically extracted from a simple database,
which is very easy to update. This database has been continuously updated and
improved since it was created in late 1997.

<br>     The form above gives you access to a very crude search engine for
searching the database material. In the end I hope to provide the same search
functionality here as in the <i><a href="../canon/">Archive of Okrandian
Canon</a></i> but for the moment, this will have to do.

<br>     <b>Instructions:</b> You may type any word or part of a word to search
for, the engine is totally ignorant about to different kinds of characters, and
treat spaces like any other character. The engine is case insensetive, except if
you make searches using »Klingon«. Note, however, that searches made using »All
data« are always case insensetive, even when it comes to words in Klingon.

!
}


print html_foot();



