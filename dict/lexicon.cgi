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
        my ($field, $cont) = m/^([^:]+):\s+(.*)/; # field name & cont
        $cont =~ s/([<>«»])//g;                # remove <>«»
        $cont =~ s#([{}])#($1 eq "{"?"<b>":"</b>")#ge;  # boldify
        $cont =~ s#~(.*?)~#<i>$1</i>#g;        # apply italics
        $cont =~ s#(.*)¿\?(.*)#$1$2 (uncertain translation)#g; #
        if ($field eq "tlh") {                 #
            print "  <tr><td colspan=\"3\"><hr noshade></td></tr>";
            print "  <tr>\n";                  #
            print "    <td>$matches. </td>\n"; #
            print "  <th align=\"left\">$fieldnames{$field}: </th>\n";
            print "<td>$cont</td>\n";          #
        } elsif ($field ne "data") {           #
            print "<tr valign=\"top\">\n";         #
            print "    <td></td>\n";           #
            print "  <th align=\"left\">$fieldnames{$field}: </th>\n";
            print "<td>$cont</td>\n";          #
        }                                      #
    }                                          #
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
<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 3.2//EN">
<html><head><title>Klingon Pocket Dictionary: Lexicon.</title></head>
<body vlink="#777777" alink="#aaaaaa" link="#444444" text="#000000" bgcolor="#ffffff">

<table border="0" cellpadding="1" cellspacing="0" width="100%">
<tr><td valign="top">

<!-- ==================== Title. ==================== -->
<center>
<a href="../"><img src="pic/title.gif" width="400" height="166" alt="tlhIngan Hol mu'ghom mach" border="0"></a>
<h1>Klingon Pocket Dictionary: Lexicon</h1>
<p>
  <table align="center" bgcolor="#BBBBBB" cellpadding="5">
    <tr>
      <td align="center"><b>Some info and a searchable version of the pocket
        dictionary database.</b></td>
    </tr>
  </table> 
</center>

EOF
}

sub html_form {
    (my $script_name = $0) =~ s#^.*/##;
    return
	start_form({-method=>"get", -action=>$script_name}),
	table({-border=>0, -cellpadding=>0, -cellspacing=>0, -align=>"center"},
	      Tr({-align=>"center"},[
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

<!-- ==================== Copyright ==================== -->
<p><center><table cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td valign="bottom" colspan="3"><hr noshade></td>
  </tr>
  <tr>
    <td>         </td>
    <td align="center"><b>©1998&ndash;2009, Copyright 
      <a href="mailto:mp\@klingonska.org">Markus Persson</a> & 
      <a href="mailto:zrajm\@klingonska.org">Zrajm C Akfohg</a>, 
      <a href="http://www.klingonska.org/">Klingonska Akademien</a>, Uppsala.</b></td>
    <td>         </td>
  </tr>
  <tr>
    <td valign="top" colspan="3"><hr noshade></td>
  </tr>
</table>
</center>

</td>

<!-- ==================== Navigation flaps ==================== -->
<td valign="top"><table cellspacing="2" cellpadding="0">
  <tr><td><a href="./"               ><img
    src="pic/about.gif"   width="21" height="65"  alt="About"            border="2"></a></td>
  </tr><tr><td><a href="intro.html"  ><img
    src="pic/intro.gif"   width="21" height="124" alt="Introduction"     border="2"></a></td>
  </tr><tr><td                       ><img
    src="pic/lexicon.gif" width="21" height="84"  alt="Lexicon"          border="0"></td>
  </tr><tr><td><a href="suffix.html"><img
    src="pic/suffix.gif"  width="21" height="128" alt="Suffix Guide"     border="2"></a></td>
  </tr><tr><td><a href="tables.html" ><img
    src="pic/tables.gif"  width="21" height="180" alt="Reference Tables" border="2"></a></td>
  </tr>
</table></td></tr></table>
</body></html>
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
print "\n<p><center>\n";
print html_form();
print "</center>\n\n";



for ($form{field}) {
    $query="^tlh:.*?$query",    last if /^tlh$/;  # klingon search
    $query="^en:.*?(?i)$query", last if /^en$/;   # english search
    $query="^sv:.*?(?i)$query", last if /^sv$/;   # swedish search
    $query="^[^:]*:.*?(?i)$query";                # search all fields
}

if ($form{query} ne "") {
    my @buf  = ();                             # clear buffer
    my $matches = 0;                           # clear no of matches
    print "<p><table align=\"center\" border=0 cellpadding=0 cellspacing=0>\n";
    print "<tr><td colspan=3>You searched for »$form{query}« ";
    print "in all $fieldnames{$form{field}} fields.";
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
    if ($matches == 0) {
	print "<tr><td colspan=3><hr noshade></td></tr>\n";
	print "<tr><td colspan=3>There were no matches.</td></tr>\n";
    }
    close DICT;
    print "<tr><td colspan=3><hr noshade></td></tr>";
    print "<tr><td colspan=3>$matches match".($matches==1?"":"es").".</td></tr>";
    print "</table>\n";
} else {
print <<"EOF";

<p align="justify">The book has both a Klingon&ndash;English, and an English&ndash;Klingon
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

EOF
}


print html_foot();

#[eof]
