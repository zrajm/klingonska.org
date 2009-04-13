#!/usr/bin/perl -w
#
# TODO: rejäl upprensning i variabelnamnsträsket, se till att alla
#       variabler har vettiga namn och vettigt scope.
#
#     o uppstrukturering av kod/data. Se till att HTML-tjafs står för sig
#       (sist?) i källkoden.
#
#     o make all html lowercase
#
#     o include prototypes for all subs
#
#     o perhaps one could count in how many files each respective word in
#       a search exists (multiple occurances counted as end). This
#       would help if you get a a word which occurs to often to be
#       able to display it (max= in more than 30 different öl!)
#
# FIXME: loggning, implementera sidonr för böcker
#    visa alla träffar när filerna preliminärvisas
#
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
# [2009-04-13, 18:05- ] 


# Implementera vettig standardheader för filformatet.
#
#
#
# $query            = original query (string)
# $query_clean      = query as it was interpreted
# @query_regex[$i]  = the one used to grep through files, of i length
#   @query_word[$i] = the words of the query (un-regexed)
#   @query_not [$i] = true when $query_regex[$i] shouldn't match
#   @query_case[$i] = true when $query_regex[$i] is case sensetive
# $query_mark       = single regex for marking matches in output
#


use utf8;
use CGI qw(:standard);
binmode(STDIN,  ":encoding(utf8)");
binmode(STDOUT, ":encoding(utf8)");



###############################################################################
##                                                                           ##
##  Functions                                                                ##
##                                                                           ##
###############################################################################


sub search_result {
    &split_query($form_query);                  # split into $query_{word,case,not} lists
    &old_form;                                  # output page header & form
    if (defined $form_debug) {                  #
        &developer_query_dump();                #   show query from string
    } else {                                    #
        &log_query();                           #   log the search
    }                                           #

    # file name globbing
    @file          = sort glob("data/*.txt");        # glob up a file name list

#print "<pre>";
#print "$_\n" for @file;
#print "</pre>";


    $no_of_files   = @file;                     # number of files searched
    $no_of_matches = 0;                         # number of matching files
    $output_buffer = "";                        # output buffer

    if (@query_word == grep $_, @query_not) {   # all search words are negated
        $output_buffer  = "<H2>You may not negate all search words.</H2>\n\n";
        $output_buffer .= &suggest_search;      #
    } else {                                    # not all words are negated
        FILE: foreach $FILE (@file) {           #   for each file
	    open(FILE, "<:encoding(utf8)", $FILE)
		or next FILE;
            #open FILE or next FILE;             #   ..that can be opened
            $text = join '', <FILE>, ' ';       #   read contents
            close FILE;                         #

            # resolve hypenation and remove comments
            $text =~ s/(?<=[$alph])[-­] *\Q[[keep hyphen]]\E\n/-/g; # keep hyphen
            $text =~ s/(?<=[$alph])[-­]\n//g;   # remove hypenation
            $text =~ s/(?<=[-­][-­])\n//g;      # keep en-dashes
            $text =~ s# *\Q[[\E.*?\Q]]\E##g;    # remove comments [[...]]

            # check if file matches
            $j = 0;                             #
            foreach my $regex (@query_regex) {  # for each regex
                next FILE                       #   that doesn't match
                    unless $query_not[$j]       #   ..skip to next file
                    xor $text =~ /$bow$regex$eow/;
            } continue { $j++ };                #
            # FIXME: we should display matches of TKD, CK, PK
            # the other canon works differently, so that page
            # numbers are shown for each match
            $no_of_matches++;                   # count matching files
            &store_match($FILE);                # matches!
        }

        # search done; is there a reason NOT to show the result?
        if ($no_of_matches > $maximum_matches) {# too many matches found
            $output_buffer = &kill_search;      #
        } elsif  ($no_of_matches == 0) {        # no matches found
            $output_buffer  = "<H2>There are ". #
                " no documents containing the ".#
                "string".($#query_word?"s":""). #
                " you searched for.</H2>\n\n";  #
            $output_buffer .= &suggest_search;  #
        }                                       #
    }

    &display_matches;                           # 
    print `$path/.foot.cgi -`;                  # page footer
}


sub store_match ($) {
    # the filename gets passed here as an argument
    # the text of the file is available in $text, and the
    # the only thing that has been done to it is 
    # the removal of ALL comments and hypenation
    # (i.e. to capture any page comments, we need to
    # act before calling this routine - or rewrite
    # something)
    my ($title, $linked) = file2title($_[0]);   # get name of document
    $output_buffer .= "<DL>\n" .                # add it to output buffer
        "  <DT><B>$title</B>\n" .               #
        "  <DD><font size=\"-1\">";             #

    $characters = 0;                            #
    $context = "";                              #
    # FIXME: This while loop should probably be re-written to use as many *different*
    # matching words as possible. Instead of just outputting the x number of matches
    # that comes first in each file. A loop over (parts of) $query_regex[$i] could
    # prove fruitful.
    while (
        $characters < $description_length
        and $text =~ /$bow$query_mark$eow/gx
    ) {
        $foundpos = pos($text);
        ($context, $incomplete) = &context(     # get context of found word
            $text,                              #
            pos($text)-length($1)-$context_length, # left pos in string
            $context_length*2+length($1)        # size of pre- & post-context
        );

        $context =~ s#\n+(?:[>:] *)*# #g;                 # TODO: remove or keep?
                                                          # this thingy removes the line
                                                          # quote signs ":" and ">"

        $context =~ s#\A  [$alph]* [^$alph]+   ##sox      # trim initial half-word & space
            unless $incomplete<0;                         #
        $context =~ s#   [^$alph]+  [$alph]* \Z##sox      # trim final space & half-word
            unless $incomplete>0;                         #

#        # break contexts at new paragraph or between words
#        $left_context   =~ s#(?:.*(?:\n[\t  ]*  ){2,}  |\A [$alph]*[^$alph]+  )##sox
#            if $lbeg;
#        $right_context  =~ s#(?:  (?:  [\t  ]*\n){2,}.*|  [^$alph]+ [$alph]*\Z)##sox
#            if length($right_context) == $context_length;


        $context     =~ s/\n+/ /g;              # linefeed = space
        $characters +=  length $context;        # size of match description

        # mark found word(s) (by inserting [[...]] around it - it is ok to use the
        # comment symbols, because we've already removed all the comments in the
        # text and we need something here that both is unaffected by the HTML encoding
        # and guaranteed not to occur in the text naturally
        $context     =~ s#$bow($query_mark)$eow#[[$1]]#g;
        $context     =  &html_encode($context); # htmlify description

        # convert the found word marks (i.e. [[...]]) into HTML tags
        $context     =~ s#\Q[[\E#<FONT COLOR="\#FF0000"><B>#go;
        $context     =~ s#\Q]]\E#</B></FONT>#go;#

        $output_buffer .= "\n  ".($incomplete>=0?"<B>...</B>":"").
#            " ".($linked?"":"[$page****]").     # this should add the page number
            " $context";
    }                                           #
    $output_buffer .= "\n  ".($incomplete<=0?"<B>...</B>":"");
    $output_buffer .= "</font>\n</DL>\n\n";     #
}






sub old_form {
    # "Clean Up Query" link
    unless ($query_clean eq $form_query) {      # is query string messy?
        $clean_link = "\n      <BR>  · " .      #   create "clean up" link
            "<A HREF=\"$Script_Url?query=" .      #   to add in form
            &url_encode($query_clean) .         #
            "\">Clean Up Query</A>  ";          #
    }
    $file_arg = "\n<INPUT TYPE=HIDDEN NAME=file VALUE=\"".&html_encode($form_file)."\">"
            if $form_file;
print <<eop;
<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.0 Transitional//EN">
<HTML><HEAD><TITLE>Klingonska Akademien - $ENV{X_TITLE}</TITLE></HEAD>
<BODY VLINK="#777777" ALINK="#AAAAAA" LINK="#444444" TEXT="#000000" BGCOLOR="#FFFFFF">


<!-- ==================== Adressinfo ==================== -->
<TABLE BORDER=0 CELLPADDING=0 CELLSPACING=0 WIDTH="100%" ALIGN=CENTER>
  <TR>
    <TD ALIGN=LEFT><I><FONT SIZE=1><A HREF="mailto:webmaster\@klingonska.org">webmaster\@klingonska.org</A></FONT></I></TD>
    <TD ALIGN=CENTER><I><FONT SIZE=1><A HREF="$PAGE_URL">$PAGE_URL</A></FONT></I></TD>
    <TD ALIGN=RIGHT><I><FONT SIZE=1>$changed</FONT></I></TD>
  </TR>
</TABLE>



<p><FORM ACTION="$Script_Url" METHOD="GET">$file_arg
<table cellspacing=0 cellpadding=0 border=0 align=center>
  <tr>
    <td rowspan=2 align=center><a href="./"><img
      src="/pic/kabutton.gif" width=92 height=82 alt="Klingonska Akdemien." border=0
      hspace=10></A></td>
    <td colspan=3><h2>$ENV{X_TITLE}</h2></td>
  </tr>
  <tr>
    <td><INPUT TYPE=TEXT NAME=query VALUE="${\&html_encode($form_query)}" SIZE=35></td>
    <td> <INPUT TYPE=SUBMIT  VALUE="Search"></td>
    <td><font size="1">  · <A HREF="$Script_Url?get=help">Search Help</A>  $clean_link</font></td>
  </tr>
</table>
</form>

eop
}

sub empty_form {
print <<"eop";
<center>
<FORM ACTION="$Script_Url" METHOD="GET">
<table cellspacing=0 cellpadding=0 border=0>
  <tr>
    <td>             </td>
    <td><INPUT  TYPE=TEXT NAME=query VALUE="" SIZE=30></td>
    <td> <INPUT TYPE=SUBMIT VALUE="Search"></td>
    <td><font size="1">  · <A HREF="$Script_Url?get=help">Search Help</A></font></td>
  </tr>
</table>
</FORM>
</center>
eop
}


sub new_form {
    print `$path/.head.cgi`;                      # page footer

    &empty_form();
    print <<eop;                                # empty form

<center>
<p><B>Modifiers:</B> .=case insensetive / -=negative search
<br><B>Wildcards:</B> *=alphanumeric / space=other (only in phrases)

<table width="75%" border=0>
  <tr>
    <td colspan=3><b><font color="#FF0000"
      size=5>2001-10-17: Killed a minor bug that caused some
      search results not to be boldified. Don\'t forget to
      report those bugs folks!</font></b>

      <p><b><font color="#FF0000" size=5>2001-10-12: This a new
      version of the »Okrandian Canon Search«, so please bear with me,
      and <i>please</i> report any odd behaviour that you might
      spot.</font></b>

      <p><b><FONT COLOR="#FF0000">If your are fluent in Perl, and wish
      to, you could help greatly in improving the quality (and speed,
      and readability) of my code. All such help would be greatly
      appreciated (and duly credited, of course), just drop me an
      email and I\'ll send the source code to you.</font></b>


    <p>Features I hope to include next are:

    <UL>

    <LI>Possibility search <i>all</I> Okrandian canon material
    (including books and tapes written by Marc Okrand). The
    copyrighted material will not be presented in full but each found
    word will be presented with some context and page
    references. (Right now you can search for things in TKD, CK and
    PK, but you only get the context - no page references - so it
    doesn\t really do you any good.)

    <LI>Better, (more complete) info about each document in the search
    result. Not just the filename should be displayed, but the name of
    the article, author, date etc.

    <LI>Better labeling of (internal html links to) found words. I
    want to be able to link directly to a specific word (any word) in
    canon from just about anywhere else. This, labeling, also should
    not change over time. I want to be able to link to something like:
    »...<TT>search.cgi?file=1997-09-01.txt#hello:2</tt>«, meaning »the
    second occurance of the word "hello" in the file
    "1997-09-01.txt"«.
    </UL>

    Suggestions and criticism are always welcome. You may use email,
    or type a message in the text area below. But don\'t forget to
    state your own email address, as I have no other way of knowing
    where to send my reply.</td>

  </tr>
</table>

</center>

eop
print `$path/.foot.cgi -`;                      # page footer
}








sub help_page {
print `$path/.head.cgi`;                      # page header
    print <<eop;

<H2>Help on Searching</H2>


<!-- FIXME: Find a better example phrase to use in the table
below. I.e. one that does not begin or end in an apostrophe (since
this looks nasty in combination with the quotes) and that contains at
least one word that is homographic with a word in English when
searched for case-insensetively. -->

<!--
<TABLE border=2 CELLSPACING=0 CELLPADDING=5 WIDTH="90%" ALIGN=CENTER>
<TR VALIGN=TOP>
  <TH>taHjaj wo\'</TH>
  <TD>Will find all documents that contain both the word »<TT>wo\'</TT>« and
  the word »<TT>tahjaj</TT>«. The order and placement of the words in
  the document is not important, notice, however, that the search is
  case-insensetive (which is probably not something you want if
  you\'re searching for a word in Klingon).
</TR>
<TR VALIGN=TOP>
  <TH>"taHjaj wo\'"</TH>
  <TD>This will find any occurance of the phrase »<TT>tahjaj wo\'</TT>«
  (i.e. the words must occur in the same order you wrote them, and
  there may not be any other words between them). All non-alphabetical
  characters (e.g. puntuaction marks) in the document are ignored so
  this query would match a document containing the string »<TT>TAHJAJ,
  WO\'</TT>«.</TD>
</TR>
<TR VALIGN=TOP>
  <TH>.taHjaj wo\'</TH>
  <TD>This query matches any document that contains both the given
  words, however search for the word »taHjaj« is case-sensetive so it
  must be exactly matched (a wise thing if you\'re searching for a
  word in Klingon).</TD>
</TR>
<TR VALIGN=TOP>
  <TH>taHjaj -wo\'</TH>
  <TD>This would match any document that contains the word
  »<TT>taHjaj</TT>«, but not the word »<TT>wo\'</TT>«.</TD>
</TR>
<TR VALIGN=TOP>
  <TH>taH* wo\'</TH>
  <TD>Matches any document that contains the word »<TT>wo\'</TT>« and a
  word that begins with »<TT>tah</TT>«. The asterisk matches any
  number of alphabetical characters (including apostrophe) and may be
  used anywhere in a word or phrase. (Any search word consisting of
  only an asterisk is ignored, however.)</TD>
</TR>
</TABLE>

<P ALIGN=CENTER><B>Special chars:</B>  = ; - (minus) = exclude word from search; * (asterisk) = match
any number of letters, numbers or aphostrophes.
-->

<TABLE border=2 CELLSPACING=0 CELLPADDING=5 xWIDTH="90%" ALIGN=CENTER>
<TR VALIGN=TOP>
  <TH COLSPAN=2>Character</TH>
  <TH>Function</TH>
</TR><TR>
<TR VALIGN=TOP>
  <TH>=</TH>
  <TH>equal</TH>
  <TD>Makes the matching of the search term case sensetive (prefix).
</TR><TR>
  <TH>-</TH>
  <TH>minus</TH>
  <TD>Document matches only if the search term <I>does not</I> occur in it (prefix).</TD>
</TR><TR>
  <TH>"..."</TH>
  <TH>quotes</TH>
  <TD>Allow spaces inside search terms (circumfix).</TD>
</TR><TR>
  <TH>*</TH>
  <TH>asterisk</TH>
  <TD>Matches any sequence of numbers (0-9), letters (a-z) or apostrophes (\') (wildcard).</TD>
</TR><TR>
  <TH> </TH>
  <TH>space</TH>
  <TD>Wildcard matching the inverse of »*« (only inside phrases, i.e. within quotes) (wildcard).</TD>
</TR>
</TABLE>


<H3>Search Terms</H3>

A search term may consist of either a word or a phrase. If you have
more than one search term then they are combined with logical "and",
i.e. for a document to match all search terms must be present (except
when using negative search terms, see below). A phrase is a search
term containing one or more spaces, these search terms must be given
within <B>quotes</B> ("like this"). Asterisks and spaces are wildcard
characters inside a phrase, while all other characters are interpreted
literally, outside a phrases only the asterisk can be used as a
wildcard character. One can not use quotes within a phrase (as this
would terminate the phrase).


<H3>Modifiers</H3>

There are two modifiers which may be prefixed to a search term (either phrase
or word). If any of these occur within a phrase (inside quotes) they are
interpreted literally. An <B>equal</B> sign makes the search term case
sensetive (quite useful when searching for something in Klingon) meaning that
it will only match words which are <I>identical</I> even when it comes to
upper/lower case. E.g. the search term »<TT>=voDleH</TT>« only matches the word
"voDleH", while the term »<TT>voDleH</TT>« would also match "VODLEH", "vodleh",
"VoDlEh" etc. A <B>minus</B> inverts the matching so that only a document which
does <I>not</I> contain the search term matches.

<BR>     If you use minus and equal at the same time, they may come in
either order (»<TT>-=voDleH</TT>« and »<TT>=-voDleH</TT>« mean the same thing)
but they must always be placed outside any quotes (i.e. the search term
»<TT>-="voDleH"</TT>« means the same thing as the two previous examples, while
»<TT>"-=voDleH"</TT>« does not).


<H3>Wildcards</H3>

The <B>asterisk</B> is a wildcard character matching any sequence consisting of
zero or more letters (a-z), aphostrophes (\') and/or numbers (0-9). The
<B>space</B> is also a wildcard (when used within quotes) which matches the
exact opposite of the asterisk, i.e. any sequence of characters that <I>does
not</I> include a letter, aphostrophe or number. This means that the search
term »<TT>=jatlh qama\' jI\'oj</TT>« e.g. will find any file that contains the
text "jatlh qama'; jI'oj", even though when there is a semi-colon between the
two sentences.


eop
print `$path/.foot.cgi -`;                      # page footer
}


#########################################################################################
#########################################################################################
#########################################################################################


sub developer_query_dump () {
    # developer info (dump word, rexes etc.)
    print "<table cellspacing=0 border=1 align=center>\n";
    print "  <tr>\n";
    print "    <th colspan=2>word</th>\n";
    print "    <th>regex</th>\n";
    print "  </tr>\n";
    for my $i (0..$#query_word) {
        print "  <tr".($query_not[$i]?" bgcolor=grey":"").">\n";
        print "    <td>$query_not[$i]$query_case[$i]</td>";
        print "    <td>$query_word[$i]</td>\n";
        my $x = $query_regex[$i];               # shorten long regexes
        $x =~ s#$alph#[:alph:]#go;              # involving $alph
        print "    <td>$x</td>\n";
        print "  </tr>\n";
    }
    print "  <tr>\n";
    print "    <th colspan=3>mark regex</th>\n";
    print "  </tr>\n";
    print "  <tr>\n";
    my $x = $query_mark;               # shorten long regexes
    $x =~ s#$alph#[:alph:]#go;              # involving $alph
    print "    <td colspan=3>$x</td>\n";
    print "  </tr>\n";
    print "</table> \n";
}


# this thing splits a string into words
# if a "word" contains spaces it should be quoted
# generate: four lists @query_{word,not,case,regex}[]
#   and the strings $query_mark (a regex for marking
#   found things) and $query_clean (a cleaned up version
#   of the query - as interpreted by the program).
# returns the number of substings in the query
sub split_query ($) {
    local $i;
    # split into substrings
    @query_word =                               # split string into list
        grep { defined($_) and $_ ne '' }       #   of quoted or unquoted words 
        split m#(?: *([-­+=]*"[^"]*"?) *| +)#o, #
            $_[0];                              #

    # quote removal & handling of -+= prefixes
    my ($pre, $i) = 0;                          #
    foreach (@query_word) {                     #
        ($pre, $_) = m#^([-­+=]*)"?([^"]*)#o;   # extract prefix & del quotes
        s/([ *])\1*/$1/go;                      # compress multiple stars/spaces
        $query_not [$i]= "-" if $pre =~ /[-­]/o;#   negated?
        $query_case[$i]= "=" if $pre =~ /[=]/o; #   case sensetive?
    } continue { $i++ }                         #

    # erase wildcards-only words
    $i = 0;                                     #
    while ($i <= $#query_word) {                #
        if ( $query_word[$i] =~ /^[ *]*$/o ) {  # if only wildcards (space/star)
            splice @query_word, $i, 1;          #   delete word
            splice @query_not,  $i, 1;          #   delete negation data
            splice @query_case, $i, 1;          #   delete case sense data
        } else { $i++ }                         #
    }                                           #

    # generate search regexes
    $i = 0;  @query_regex = @query_word;        #
    foreach (@query_regex) {                    #
        $_ = quotemeta;                         # no metacharacters
        s#\\\*#[$alph]*#g;                      # star  into wildcard
        s#\\\ #[^$alph]+#g;                     # space into wildcard
        $_ = "(?i:$_)" unless $query_case[$i];  # case insensetive?
    } continue { $i++ };

    # generate mark regex
    $i = 0;                               #
    $query_mark = '(' . join('|',               # mark regex string
        grep { defined($_) and $_ ne '' }       # 
        map  {                                  #
            $query_not[$i++] ? "" : $_          #   don't include negative
        } @query_regex) . ')';                  #   expressions

    # clean up query string
    $i = 0;                                     #
    $query_clean = join ' ',                            #
    map { $query_not [$i] . $query_case[$i] .   # -= prefix
        ( $query_word[$i] =~ /(^[-­+=]| )/o     # contains space or prefix?
          ? "\"$query_word[$i++]\""             #   then quote it
          :    $query_word[$i++]                #   otherwise don't
        )                                       #
    } @query_word;                              #

    return $#query_word+1;                      # return no of query words
}











# url encode ascii/latin1 strings               
sub url_encode ($) {                            #
    $_ = $_[0];                                 #
    s/([^-.*0-9A-Z_a-z ])/sprintf("%%%X", ord $1)/goe;
    s/ /+/go;                                   #
    return $_;                                  #
}

# html encode ascii/latin1 strings
sub html_encode ($) {
    $_ = $_[0];                                 #
    s#&#&amp;#g;                                #
    s#"#&quot;#g;                               #
    s#<#&lt;#g;                                 #
    s#>#&gt;#g;                                 #
    return $_;                                  #
}


sub log_query {
    my $logpath = "$ENV{DOCUMENT_ROOT}/logs/";      # path
    # set $date to current time
    use Time::Local;                                #
    ($sec, $min, $hour, $mday, $mon, $year) = localtime(time);
    $date = sprintf "%04d-%02d-%02d, %02d.%02d.%02d",
        1900+$year, ++$mon, $mday, $hour, $min, $sec;

    ##############################################
    # log query                                  #
    if ( $form_query ) {                         # if there is a query
        if ( open(LOG,">>${logpath}archive_search.log") ) {
            print LOG "$date $form_query\n";       #   print log
            close(LOG);                          #   close logfile
        }                                        #
        &inc_counter("${logpath}archive_search.count"); # inc log counter
    } ############################################
    return 1;
}

sub inc_counter {
    my $file = shift;
    ################################################
    # Updatera räknaren
    if ( open(C,"<$file") ) {      # läs räknare från fil
        ( my $count = <C> )++;
        close(C);
        if (open(C,">$file")) {    # skriv räknare till fil
            print C "$count\n";
            close(C);
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
    return <<"eop";

<BR><TABLE CELLPADDING=1 CELLSPACING=0 BORDER=0 WIDTH="100%">
  <TR BGCOLOR="#000000">
    <TD><FONT SIZE="-1" COLOR="#FFFFFF">$text</FONT></TD>
  </TR>
</TABLE>

eop
}


sub display_matches () {
#    " (of $no_of_files)";
    print &status_row("There ",
        $no_of_matches == 1 ? "is " : "are ",
        $no_of_matches == 0 ? "no" : $no_of_matches, " document",
        $no_of_matches == 1 ? ""   : "s",             " matching the query ",
        "»<TT>",&html_encode($query_clean),"</TT>«.");
    print $output_buffer;
}


sub file2title ($) {
    my ($info, $link) = ($_[0], "");
    ##############################################
    ## FIXME: The $info-checking below should
    ## (probably) be replaced with something
    ## that collects the info from the files in
    ## question (i.e. reads the header of the file
    ## as this is far more flexible
    ##############################################
    $info =~ s#.txt$##;                         ##
    $info =~ s# TMP        #The motion pictures#ox;
    $info =~ s# TKD        #<I>The Klingon Dictionary</I>#ox;
    $info =~ s# TKW        #<I>The Klingon Way</I>#ox;
    $info =~ s# KGT        #<I>Klingon for the Galactic Traveler</I>#ox;
    $info =~ s# CK         #<I>Conversational Klingon</I>#ox;
    $info =~ s# PK         #<I>Power Klingon</I>#ox;
    $info =~ s# bop        #<I>Bird of Prey Cutaway Poster</I>#ox;
    $info =~ s# SBX        #<I>SkyBox Trading Cards</I>#oxi;
    $info =~ s# stc        #About <I>Star Trek: Continuum</I>#ox;
    $info =~ s# laggtill   #Not officially added yet#ox;
    ## type of document
    $info =~ s# ^_?p(.*) #$1$2 (Partial, uncompleted transcript)#x;
    $info =~ s# ^_?t(.*) #$1$2 (Complete transcript)#x;
    $info =~ s# ^_?w(.*) #$1$2 (Transcript of Klingon words)#x;
    $info =~ s# ^_?e(.*)2#$1$2 (2nd transcript of Klingon phrases)#x;
    $info =~ s# ^_?e(.*) #$1$2 (Transcript of Klingon phrases)#x;
    $info =~ s# ^_(.*)\)   #$1; old file)#x;
    $query=  &url_encode($form_query);
    $link = 1
    if $info =~ s#(\d\d\d\d(?:-\d\d){0,2}\w?|sarek)#<A HREF="$Script_Url?query=$query&file=$1.txt">\u$1.txt</A> (<A HREF="$1.txt">text file</A>)#;
    return $info, $link;
}


sub suggest_search () {
    return <<"eop";

<P>You could try to:

<UL>
  <LI>Make sure all words are spelled correctly.
  <LI>Use different keywords.
  <LI>Use more general keywords.
  <LI>Turn off some negative search words (leading minus).
</UL>
eop
}

sub kill_search () {
    return <<"eop";
<H2>Allowed number of matches ($maximum_matches) exceeded, search result withheld.</H2>

<P ALIGN=JUSTIFY>There are $no_of_matches files matching your query,
however the maximum allowed number of matches is $maximum_matches, and
the result of your query have therefore been withheld. You may try to
narrow your search (e.g. by specifying more search words or making
your search case-sensetive). More information on how to use this
search engine can be found in the section »<A
HREF="$Script_Url?get=help">Search Help</A>«.


<BR>     This limitation has been imposed for copyright reasons, but
should hopefully not be to much of a obstruction. If you would like to
contribute (with ideas, suggestions, critisism, corrections, more
data, whatever) please do not hesitate to contact me <i>&lt;<a
href="mailto:zrajm\@klingonska.org">zrajm\@klingonska.org</A>&gt;</I>. I\'m
always interested to know what you think about this site.

eop
}





sub display_file () {
    my $form_file = "data/$form_file";
    $ENV{"X_PREV"}  = "$Script_Url?query=".&url_encode($form_query);
    print `$path/.head.cgi`;                    # page header
    &split_query($form_query);                  # split into $query_{word,case,not} lists

    print &status_row("Displaying the file »<TT>$form_file</TT>« ",
        "according to the query ",
        "»<TT>",&html_encode($query_clean),"</TT>«.");

    open FILE, $form_file;                      # FIXME: add some error msg if file not found
    $text = join '', <FILE>; close FILE;        # read entire file

    # resolve hypenation and remove comments
    $text =~ s/(?<=[$alph])[-­] *\Q[[keep hyphen]]\E\n/-/g; # keep hyphen
    $text =~ s/(?<=[$alph])[-­]\n//g;           # remove hypenation
    $text =~ s/(?<=[-­][-­])\n//g;              # keep en-dashes
    $text =~ s# *\[\[.*?\]\]##g;                # remove comments [[...]]


    # mark found word(s) (by inserting [[...]] around it - it is ok to use the
    # comment symbols, because we've already removed all the comments in the
    # text and we need something here that both is unaffected by the HTML encoding
    # and guaranteed not to occur in the text naturally
    @name = ();                                 # clear array @name
    $text =~ s#$bow($query_mark)$eow#&linkname($1)#ge;
    # "&linkname" generates a list of the names of the links, as
    # well as returns a string looking like this "[[N[×]TEXT]]" where
    # N is the number of the link label, and TEXT is the text sought for

    $text = &html_encode($text);                # htmlify text

    # convert the found word marks (i.e. [[...[×]...]]) into HTML tags
    $text =~ s#\Q[[\E#<FONT COLOR="\#FF0000"><B><A NAME="#go;
    $text =~ s#\Q[×]\E#">#go;                   #
    $text =~ s#\Q]]\E#</A></B></FONT>#go;       #

    for ($text) {
        s#^====+$#<hr noshade>#gm;              # thick <hr>
        s#^----+$#<hr noshade width="50%" align=center>#gm; # thin <hr>
        s#(?:\A\n+|\n+\Z)##sg;                  # leading/trailing blank lines
        s#\ (?=\ )# #g;                         # spaces = nbsp:es +1 space
        s#(\n\n+)(?!<)#$1<p>#g;                 # insert <p> after two lf
        s{^( &gt; | : |  | To:   |              # insert <br> före rader som
             Subject:    | Date: |              #   börjar på punctuatuon
             Newsgroups: | From:                #   (boldifiera perfixen)
           )}{<br>$1}mxg;                       #                            
        s{^(<(?i:br|p)>)                        # insert <br> before rows
           ( (?:&gt;\ *|:\ *)+ | To:   |        #   befinning with punctuation
             Subject:          | Date: |        #   (boldify row prefixes)
             Newsgroups:       | From:          #
           )}{$1<b>$2</b>}mxg;                  #
    }

    # FIXME: ordna länkarna efter söksträng

#    @expression = (); @number = (); $i = 0;
#    foreach $word (@name) {
#        $j = 0;
#        foreach my $regex (@query_regex) {  # for each regex
#            if ( $word =~ /$bow$regex$eow/ ) {
#                $expression[$j] = $query_word[$j];
#                $number[$j]     = $i;
#            }
#        } continue { $j++ }
#    } continue { $i++ }


    %found = ();                                # clear a hash
    @found = ();                                # and an array
    FOUND:
    foreach $i (0..$#name) {
        EXPRESSION:
        foreach $j (0..$#query_regex) {
            if ($name[$i] =~ /$bow$query_regex[$j]$eow/ ) {
                $found{$query_word[$j]} .= " $i";
                push @found, $query_word[$j];
                next FOUND;
            }
        }
    }


    print "<dl>\n";
    foreach $i (0..$#query_word) {
        next if $query_not[$i];
        print "<DD>";
        @x = split " ", $found{$query_word[$i]};
        print "»<TT>$query_word[$i]</TT>« ",
            "is case ", $query_case[$i]?"":"in", "sensetive and ",
            "occur", $#x==0?"s":"",  " ",  $#x+1,
            " time", $#x==0?"" :"s", "\n";
        $j = 0;
        print " (";
        foreach (@x) {
            print ", " if $j;
            print "<A HREF=\"#",($_+1),"\">»", ++$j, "</A>";
        }
        print ")";
        print ".";
    }
    print "</dl>\n\n";





    print "<hr noshade>";

#    print "<!--";
#    print join ', ', sort keys %found;
#    print "\n<BR>";
#
#    print join ', ', @query_word;
#    print "\n<BR>";
#
#    print "Found ",$#name+1," words.";
#    print "\n<table border=0>\n";
#    print "\n<tr><th><th>",join '<th>', (0..$#name);
#    print "\n<tr><th>found:<td>",join '<td>', @name;
#    print "\n<tr><th>regex:<td>",join '<td nowrap>', @found;
#    print "\n</tr></table>\n";
#
#
#
#            print "<A HREF=\"#$i\">&gt;&gt;$_</A>\n";
#    print "-->";

    print "\n<p>$text\n\n";                     # output text
    print `$path/.foot.cgi -`;                  # page footer

}


sub linkname ($) {
    push @name, $_[0];
    return "[[".scalar(@name)."[×]$1]]";
}



###############################################################################
##                                                                           ##
##  Initialization                                                           ##
##                                                                           ##
###############################################################################


$ENV{"X_YEAR"}  = "2002";                      # year
$ENV{"X_LANG"}  = "en";                        # language
$ENV{"X_NOLOG"} = "YES";                       # turn of loggingOA
$ENV{"X_TITLE"} = "Okrandian Canon Search (BETA 0.5b)";# page title


$maximum_matches    = 30;                      # max allowed number of hits
$description_length = 300;                     # max length of file descr.
$context_length     = 35;                      # max length of found context
# context length is always shortened, so this is only an
# approximate value (it can never grow bigger than this though)

# things for regexes
$alph = "'0-9A-Za-z".                           # alphabetical characters
    "ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞß".          #   (note that apostrophe
    "àáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ";          #   is included)
$bow  = "(?:\\A|(?<![$alph]))";                 # beginning of word
$eow  = "(?:\\Z|(?![$alph]))";                  # end of word



# output content-type header
# (when used as SSI or loaded explicitly by
# browser, but not when called by other script)
if (not $ENV{X_CGI}) {                         # if not suppressed
    print header(-charset=>'utf-8');           # Content-type header
    $ENV{X_CGI} = "perl";                      #   and suppress it from now on
}                                              #


# get form values 
${"form_$_"} = param($_) for qw(file query get debug);# $form_(file | query | get)

#print "<br>\$form_file=$form_file\n";
#print "<br>\$form_query=$form_query\n";
#print "<br>\$form_get=$form_get\n";


# FIXME: check these variables (bad names?)
my $path = "$ENV{DOCUMENT_ROOT}";               # path
($Script_Url) = $ENV{"SCRIPT_NAME"} =~ m#([^/]+)$#;



# page header url & update time
$PAGE_URL   = "http://$ENV{SERVER_NAME}$ENV{REQUEST_URI}";
$PAGE_URL   =~ s/\?.*$//;                      #   chop off "get" args
my @time    = localtime((stat $0)[9]);         # file modification date
my $changed =                                  # format into
    sprintf "%04u-%02u-%02u, %02u.%02u",       #   YYYY-MM-DD, HH.MM
    1900+$time[5], 1+$time[4], @time[3,2,1];   #   year, month, day, hour, min

# main selection
SWITCH: {
    &help_page,     last SWITCH  if $form_get eq "help";  # display help page
    &display_file,  last SWITCH  if $form_file;           # display a file
    &search_result, last SWITCH  if $form_query;          # display search matches (w/ context)
    &empty_form,    last SWITCH  if $ENV{"SERVER_PROTOCOL"} eq "INCLUDED";
    &new_form;                                            # display a page w/ a clean form
}

__END__
