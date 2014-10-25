package Klingon;
use 5.10.0;
use strict;
use warnings;
use utf8;
use open ':locale';

BEGIN {
    use Exporter();
    our $VERSION     = 1.00;     # set the version for version checking
    our @ISA         = qw(Exporter);
    #our @EXPORT      = qw(xx);  # exported per default
    #our %EXPORT_TAGS = ( );     # eg: TAG => [ qw!name1 name2! ],
    our @EXPORT_OK = qw(
        split_letter
        split_syllable
    );
}

# KLI encoding: a|b|ch|d|e|g|h|i|j|l|m|n|f|o|p|q|q|r|s|t|x|u|v|w|y|z|'
my %re = (
    alpha => qr/a|b|ch|D|e|gh|H|I|j|l|m|n|ng|o|p|q|Q|r|S|t|tlh|u|v|w|y|'|’/,
);

my @alpha = qw/a b ch D e gh H I j l m n ng o p q Q r S t tlh u v w y ' ’/;

sub uniq {
    my %seen = ();
    return map { $seen{$_} ++ ? () : $_ } @_;
}

sub del (\@;@) {
    my $listref = shift;
    my %seen = map { $_ => 1 } @_;
    map { $seen{$_} ++ ? () : $_ } @$listref;
}

sub add_alpha { @alpha = uniq(@alpha, @_) }
sub del_alpha { @alpha =  del(@alpha, @_) }
sub get_alpha { @alpha }
sub set_alpha { @alpha =              @_  }




sub re_alpha {
    my $alpha = join("|", @alpha);
    return qr/$alpha/;
}

=item @LETTER = split_letter($KLINGON);

Splits $KLINGON into letters. Fails if not all characters $KLINGON is in the
Klingon alphabet (i.e. it may not contain spaces, punctuation, weird letters or
anything else non-Klingon).

Returns a list with each of the characters in $KLINGON in separate elements (in
list context), or just the first letter of $KLINGON (in scalar context).

On failure returns undef (in scalar context), or empty list.

"nenghep" is split into qw/n e n gh e p/.

=cut

sub split_letter {
    local ($_) = @_;
    my $alpha = re_alpha();
    my @text  = /\G$alpha(?=$alpha{2}|$alpha{0,1}$)/gc;
    return () unless /\G$/;  # failure (unless whole string is processed)
    return wantarray() ? @text : $text[0];
}

sub split_syllable {
}

1;

__END__


# prototypes
sub syllable_split(;$);             # FULLY IMPLEMENTED
sub by_klingon($$);                 # FULLY IMPLEMENTED
sub part_of_speech(;$);             # FULLY IMPLEMENTED

my %dictionary = ();
my %alphabet = (
    ' '  =>  0,    "\t" =>  0,    0    =>  1,    1    =>  2,    2    =>  3,
    3    =>  4,    4    =>  5,    5    =>  6,    6    =>  7,    7    =>  8,
    8    =>  9,    9    => 10,    a    => 11,    A    => 11,    b    => 12,
    B    => 12,    c    => 13,    C    => 13,    ch   => 14,    d    => 15,
    D    => 15,    e    => 16,    E    => 16,    f    => 17,    F    => 17,
    g    => 18,    G    => 18,    gh   => 19,    h    => 20,    H    => 20,
    i    => 21,    I    => 21,    j    => 22,    J    => 22,    k    => 23,
    K    => 23,    l    => 24,    L    => 24,    m    => 25,    M    => 25,
    n    => 26,    N    => 26,    ng   => 27,    o    => 28,    O    => 28,
    p    => 29,    P    => 29,    q    => 30,    Q    => 31,    r    => 32,
    R    => 32,    s    => 33,    S    => 33,    t    => 34,    T    => 34,
    tlh  => 35,    u    => 36,    U    => 36,    v    => 37,    V    => 37,
    w    => 38,    W    => 38,    y    => 39,    Y    => 39,    "'"  => 40,
);

my %suffix = (
    # Verb prefixes:
    # vp =>
    # FIXME!!!!
    # Verb Suffixes:
    vs1 => "'egh chuq",
    vs2 => "nIS qang rup beH vIp",
    vs3 => "choH qa'",
    vs4 => "moH",
    vs5 => "lu' laH",
    vs6 => "chu' bej ba' law'",
    vs7 => "pu' ta' taH lI'",
    vs8 => "neS",
    vs9 => "DI' chugh pa' vIS mo' " .   # (marks a subordinate clause)
         "bogh " .                      # (marks a relative clause)
         "meH " .                       # (marks a purpose clause)
         "'a' jaj " .                   # (modifies main clause)
         "wI' ghach",                   # (turns verb into noun)
    vsr => "be' qu' ".
         "Qo' " .                       # (always occur last)
         "Ha'",                         # (always 1st suffix)
    # Noun Suffixes:
    ns1 => "'a' Hom oy",
    ns2 => "pu' Du' mey",
    ns3 => "qoq Hey na'",
    ns4 => "wI' ma' lI' ra' ".          # (for beings using language)
         "wIj maj lIj raj Daj chaj ".   # (general usage)
         "vam vetlh",                   # (specification)
    ns5 => "Daq vo' mo' vaD 'e'",
);


#
# Parts-of-speech (one character abbreviations)
#
#   n - noun
#   v - verb
#   # - number
#
#   ? - question word (proposed)
#   ! - exclamation (proposed)
#   & - conjunction (proposed)
#
#
#   vs9s  = suffix type 9, subordinate clause-marker
#   vs9r  =      -''-      relative clause-marker ({-bogh})
#   vs9p  =      -''-      purpose clause-marker ({-meH})
#   vs9m  =      -''-      main-clause modifier ({-'a'}, {-jaj})
#   vs9n  =      -''-      nominalizer ({-wI'}, {-ghach})
#
# TODO
#
#   o subclassification of rovers (i.e. codify the fact that {-Qo'} and
#     {-Ha'} cannot actually "rove")
#
#   o subclassification of possessives for words capable/incapable of
#     speech (if useful for syntactic purposes)
#

my %affix = (
    # Prefixes
    ""    => "vp3p0 vp3p3p vp3s0 vp3s3p vp3s3s",
    "bI"  => "vp2s0",
    "bo"  => "vp2p3p vp2p3s",
    "che" => "vp2p1p",
    "cho" => "vp2s1s",
    "Da"  => "vp2s3p vp2s3s",
    "DI"  => "vp1p3p",
    "Du"  => "vp3s2s",
    "gho" => "vp2p1p! vp2s1p!",
    "HI"  => "vp2p1s! vp2s1s!",
    "jI"  => "vp1s0",
    "ju"  => "vp2s1p",
    "lI"  => "vp3p2p vp3s2p",
    "lu"  => "vp3p3s",
    "ma"  => "vp1p0",
    "mu"  => "vp3p1s vp3s1s",
    "nI"  => "vp3p2s",
    "nu"  => "vp3p1p vp3s1p",
    "pe"  => "vp2p0!",
    "pI"  => "vp1p2s",
    "qa"  => "vp1s2s",
    "re"  => "vp1p2p",
    "Sa"  => "vp1s2p",
    "Su"  => "vp2p0",
    "tI"  => "vp2p3p! vp2s3p!",
    "tu"  => "vp2p1s",
    "vI"  => "vp1s3p vp1s3s",
    "wI"  => "vp1p3s",
    "yI"  => "vp2p3s! vp2s0! vp2s3s!",
    # Suffixes
    "ba'"   => "vs6",      "laH"  => "vs5",        "qoq"   => "ns3",
    "beH"   => "vs2",      "law'" => "vs6",        "Qo'"   => "vsr",
    "bej"   => "vs6",      "lIj"  => "ns4",        "qu'"   => "vsr",
    "be'"   => "vsr",      "lI'"  => "ns4 vs7",    "raj"   => "ns4",
    "bogh"  => "vs9r",     "lu'"  => "vs5",        "ra'"   => "ns4",
    "chaj"  => "ns4",      "maj"  => "ns4",        "rup"   => "vs2",
    "choH"  => "vs3",      "ma'"  => "ns4",        "taH"   => "vs7",
    "chugh" => "vs9s",     "meH"  => "vs9p",       "ta'"   => "vs7",
    "chuq"  => "vs1",      "mey"  => "ns2",        "vaD"   => "ns5",
    "chu'"  => "vs6",      "moH"  => "vs4",        "vam"   => "ns4",
    "Daj"   => "ns4",      "mo'"  => "ns5 vs9s",   "vetlh" => "ns4",
    "Daq"   => "ns5",      "na'"  => "ns3",        "vIp"   => "vs2",
    "DI'"   => "vs9s",     "neS"  => "vs8",        "vIS"   => "vs9s",
    "Du'"   => "ns2",      "nIS"  => "vs2",        "vo'"   => "ns5",
    "ghach" => "vs9n",     "oy"   => "ns1",        "wIj"   => "ns4",
    "Ha'"   => "vsr",      "pa'"  => "vs9s",       "wI'"   => "ns4 vs9n",
    "Hey"   => "ns3",      "pu'"  => "ns2 vs7",    "'a'"   => "ns1 vs9m",
    "Hom"   => "ns1",      "qang" => "vs2",        "'egh"  => "vs1",
    "jaj"   => "vs9m",     "qa'"  => "vs3",        "'e'"   => "ns5",
);


# The Klingon consonants (except {w} and {y})
my $CONS = qr/tlh|ch|gh|ng|[bDHjlmnpqQrStv']/;

# The variable $SYLL is a regular expression matching any Klingon
# syllable (you must use the /x regexp modifier though)
my $SYLL = qr/                                 #
    (?:                                        #
      (?: $CONS | [wy] )                       # onset (any consonant)
      (?:                                      # nucleus
        [aeI] (?: $CONS | rgh | [yw]'? )? |    #   (a|e|I) + coda (consonant)
        [ou]  (?: $CONS | rgh |  y  '? )?      #   (o|u)   + coda (consonant)
      )                                        #
    ) | oy                                     # or possibly just 'oy'
  /x;                                          #

# Verb Prefix (match any *one* prefix)
my $VP = qr/
    DI | Da  | Du  | HI  | Sa | Su | bI |
    bo | che | cho | gho | jI | ju | lI |
    lu | ma  | mu  | nI  | nu | pI | pe |
    qa | re  | tI  | tu  | vI | wI | yI
  /x;

# Verb Suffixes (any number of suffixes, ignoring type number)
my $VS = qr/
    'egh | chuq  |
    nIS  | qang  | rup  | beH | vIp |
    choH | qa'   |
    moH  |
    lu'  | laH   |
    chu' | bej   | law' | ba' |
    pu'  | ta'   | taH  | lI' |
    neS  |
    DI'  | chugh | pa'  | vIS | bogh | meH |
           mo'   | 'a'  | jaj |
    be'  | Qo'   | Ha'  | qu'
  /x;

# Noun Suffixes (any number of suffixes, ignoring type number)
my $NS = qr/
    'a'    | Hom    | oy |
    pu'    | Du'    | mey    |
    qoq    | Hey    | na'    |
    wI['j] | ma['j] | lI['j] | ra['j] | Daj |
             chaj   | vam    | vetlh  |
    Daq    | vo'    | mo'    | vaD    | 'e'
  /x;

# Numeric Elements
my $NE = qr/
    maH  | vatlh | SaD | SanID | netlh | bIp | 'uy' |
    DIch | logh
  /x;

my $VERB = qr/$VP($SYLL+?)$VS/;
my $NOUN = qr/($SYLL+)$NS/;

#sub verb($) {
#    local ($_) = (@_ ? @_ : $_);               #   get arg or $_
#    load_dictionary();                         #   load dictionary
#    is(VERB, $_);
#    my $VERB = qr/$VP($SYLL+?)$VS/;
#}


sub x {
    my $w = "HejghItlh";
    print "$w\n";
    print part_of_speech($w),"\n";
##    print $VERB;
    print "saocuh\n"
	if $w =~ $VERB;

}


# $SYLL+?(?=$VS+)
# process regexes
for ($SYLL, $VP, $VS, $NS, $NE, $NOUN, $VERB){ # foreach regex
    s/#.*//gm; s/\s+//g;                       #   remove comments & whitespace
    $_ = qr/$_/;                               #   and pre-compile it
}                                              #


# Usage: $affix_type = affix($affix, $stem_pos);
#
# Returns a list of possible part-of-speech/type definitions for $affix (which
# should be passed without hyphen in it). If you already happen to know the pos
# for the stem part of the word, affix() will give better predictions. (E.g.
# called using affix("wI'") both "ns4" and "vs9n" is returned, but if you know
# your stem to be a noun, call it using affix("wI'", "n") to get only "ns4"
# returned.)
#
# Returns an empty list if the affix is unknown.
sub affix(;$$) {
    my ($word, $stem_pos) = (@_ ? @_ : $_);    #   get arg or $_
    return () unless exists($affix{$word});
    my @affix_type = split(' ', $affix{$word});
    if (defined($stem_pos)) {
	@affix_type = grep /^$stem_pos/, @affix_type;
    }
    return wantarray ? @affix_type : join(' ', @affix_type);
}


# Usage: affix_pattern SUFFIX_TYPE [,...]
#
# (Internal function.) Returns a qr// quoted regex for each given SUFFIX_TYPE.
# SUFFIX_TYPE itself is a regex (^ is automatically added to it) matching any
# of suffix type names:
#
#   vs# -- verb suffix (where # is between 1 and 9, or "r" for "rover")
#   vp  -- verb prefix
#   ns# -- noun suffix (where # is between 1 and 5)
#
#
# Example: (@all_suffixes, $verb_affixes) = affix_pattern('vs|ns', 'v');

sub affix_regex(@) {                           # [2007-04-09] - [2007-04-10]
    my @regex = ();                            #
    foreach my $type (@_ ? @_ : '') {          #   for each argument
        my $regex = join'|',                   #
            sort by_klingon map {
                split / +/, $suffix{$_};
            } grep /^$type/, keys %suffix;
        $regex = qr/$regex/;
        push @regex, $regex;
    }
    return @regex;
}





# SETTINGS:
#
#   CASE_SENSETIVE (default: TRUE)  (NB: {nenghep})
#
#   STRICT_SYLLABLE_ORDER (default: FALSE) If TRUE it requires that all
#   suffixes come in the correct order, and that there is only one of each each
#   suffix type. If set to FALSE, words with bad suffix order is also
#   recognized, as long as all the suffixes belong to the same part-of-speech.
#   (The nominalizing suffixes {-wI'} and {-ghach} most still occur in their
#   right place, on the border between the verb [with it's verb suffixes, if
#   any] and any noun suffixes].)
#
#   ALLOW_UNKNOWN_WORDS (default: TRUE) If TRUE, allows any word as a stem as
#   long as it follow Klingon syllable structure. If FALSE, only words that can
#   be found in the dictionary will be recognized (can be used independently of
#   ALLOW_MARKED_FOREIGN_WORDS).
#
#   ALLOW_MARKED_FOREIGN_WORDS (default: TRUE) If TRUE, marked foreign words
#   are allowed. (I.e. the stem of a word need not follow klingon phonotax at
#   all, as long as it is "marked" with the same non-alphabetic/non-numeric
#   character at both the beginning and end -- this allows for the use of
#   English [or other language] words in the text, e.g.  {vI*love*qu'}.) NOTE:
#   the marks and/or the exact spelling is retained in all return values. (can
#   be used independently of ALLOW_FOREIGN_WORDS).
#


# Usage: $POS = affix_part_of_speech([$WORD]);
#
# Returns array of possible part-of-speechs for WORD, ("?") if no
# part-of-speech-specific affixes were found, and an empty array if WORD does
# not conform to Klingon syllable structure.
#
# A word categorized only based on its affixes, but not otherwise found in the
# lexicon has it's part-of-speech tag returned in square brackets. If the word
# is found in the lexicon, *and* has affixes matching the part-of-speech in the
# lexicon entry, then the part-of-speech tag is returned as is, and any other
# 'uncertain' (i.e. bracketed) tags are not returned (even though they might
# have been found).
#
# If a word could neither be found in the lexicon, nor found to have any known
# affixes, but otherwise conform to Klingon syllable structure, then a list
# containing a single question mark is returned ('?').
#
# If word could not be parsed or understood at all, the empty list is returned.
#

sub TRUE   {  1  }
sub FALSE  {  0  }
sub VERB   { 'v' }
sub NOUN   { 'n' }
sub NUMBER { '#' }

sub is($$) {
    my ($pos, $word) = (@_);
    return TRUE
        if exists($dictionary{$word})
            and $dictionary{$word} =~ /(^|(?<=\/))$pos/;
    return FALSE;
}



sub split_noun(;$) {
    my ($word) = (@_ ? @_ : $_);               #   get arg or $_
    load_dictionary();                         #   load dictionary
    my @suff = ();
    until (is NOUN, $word) {
	if ($word =~ s/($NS)$//) {
	    unshift(@suff, affix($1, NOUN).":-$1");
	} else {
	    return();
	}
    }
    return("n:$word", @suff);
}

sub split_verb(;$) {
    my ($word) = (@_ ? @_ : $_);               #   get arg or $_
    load_dictionary();                         #   load dictionary
    $word =~ s/^($VP?)(?=$SYLL)//;
    my ($pref, @suff) = ($1);
    until (is(VERB, $word) or is(VERB, "$pref$word")) {
	if ($word =~ s/($VS)$//) {
	    unshift(@suff, affix($1, VERB).":-$1");
	} else {
	    return();
	}
    }
    return(affix($pref, VERB).":$pref-", "v:$word", @suff);
}


# Usage: ($pos, @sylls) = part_of_speech($word);
#
# Returns the part-of-speech of $word.
#
sub part_of_speech(;$) {                       # [2007-04-25]
    local ($_) = (@_ ? @_ : $_);               #   get arg or $_
    load_dictionary();                         #   load dictionary
    my @pos = ();                              #
    if (/^($SYLL+?)$NS+$/) {                   #   noun
        if (is NOUN, $1) {                     #
            push @pos, 'n';                    #
        } else {                               #
            push @pos, '[n]';                  #
        }                                      #
    }                                          #
    if (/^$VP?($SYLL+?)$VS+$/) {               #   verb
        if (is VERB, $1) {                     #
            push @pos, 'v';
        } else {
            push @pos, '[v]';
        }
    }
    if (/^($SYLL+)$NE$/) {                     #   number
        if (is NUMBER, $1) {                   #
            push @pos, '#';
        } else {
            push @pos, '[#]';
        }
    }
    if (!@pos and /^($SYLL+)$/) {              #   klingon graphotax
        if (defined $dictionary{$1}) {
            push @pos, $dictionary{$1};
        } else {
            push @pos, '?';
        }
    }
    @pos = grep !/^\[.*\]/, @pos               #   remove uncertain choices
        if grep /^[^[]/, @pos;                 #     if there is a certain one
    return @pos;                               #
}                                              #

# Usage: @syllable = syllable_split([$KLINGON_WORD]);
#
# Splits $KLINGON_WORD (or $_ if no arg provided) into syllables, returns empty
# list if the word could not be parsed/split. $KLINGON_WORD must follow
# standard Klingon spelling (i.e. case counts).
#
# As a special case, non-klingon syllables are allowed if surrounded by either
# asterisks, underscores or slashes, the surrounding characters are never
# removed (e.g. "*road*wIjDaq" returnes "*road*", "wIj" and "Daq").
#
# CAVEAT: No attempt is made to handle the special case of "-oy" (noun suffix
# type 1)!


# FIXME: Single(?) syllable phrase should be allowed to be preceded or followed
# by hyphen.

sub syllable_split(;$) {                       # [2007-04-23]
    local ($_) = (@_ ? @_ : $_);               #   get arg or $_
    my @syllable = ();                         #   init syllable array
    unshift @syllable, $1                      #   take syllables from end of
        while s/(                              #     WORD and put into array
            (?:
                (?:[bDHjlmnpqQrStvwy']|ch|gh|ng|tlh)
                [aeIou]
                (?:[bDHjlmnpqQrStvwy']|ch|gh|ng|tlh|rgh|[wy]')?
            ) | (?:
                ([*_\/])[^\2]+\2
            )
        )$//x;
    return ($_ eq '') ? @syllable : ();        #   return array if WORD was
}                                              #     fully recognized

sub phrase_split {
    local ($_) = (@_ ? @_ : $_);               #   get arg or $_
    s/(?:[,;.:!?]|\.\.\.)$//;
    return split /(?:[,;.:!?]|\s---?|\.\.\.)?\s/;
}


# Usage: @SORTED_ARRAY = sort by_klingon, @UNSORTED_ARRAY;
#
# A sorting routine for perl's built-in "sort".
#
# FIXME: sort is un-optimized (see?: http://sysarch.com/Perl/sort_paper.html)

sub by_klingon($$) {
    my ($a, $b) = @_;
    my @a = split /(tlh|ch|gh|ng|[\d\w' \t])/, $a;
    my @b = split /(tlh|ch|gh|ng|[\d\w' \t])/, $b;
    my $m = (@a<@b ? @a : @b);
    my $x;
    for (my $i=1; $i<$m; $i+=2) {
        $x = $alphabet{$a[$i]} <=> $alphabet{$b[$i]}
            and return $x;
    }
    return @a <=> @b;
}


# Usage: load_dictionary
#
# INTERNAL FUNCTION; NOT EXPORTED. Initialize klingon.pm's internal dictionary.

sub load_dictionary() {
    # internal function
    local $_;
    return if %dictionary;
    while (<DATA>) {
        my ($pos, $word)   = split;
        $dictionary{$word} = $pos;
    }
    return 1;
}



1;


#    #       bIp
#    #/pro   maH
#    #       netlh
#    #       SaD
#    #       SanID
#    #       vatlh
#    #       'uy'


__DATA__
n/v     bach
v       bachHa'
v       bagh
n       baghneQ
v       baH
n       baHjan
n       baHwI'
v       baj
n       bal
n       bang
v       baq
n       baqghol
v       baQ
excl    baQa'
n       bargh
name    barot
n       baS
adv/n   batlh
adv     batlhHa'
v       bav
v       ba'
n       beb
v       bech
n       begh
n       beH
v       bej
n/v     bel
v       belHa'
n       bem
n       ben
n/v     bep
n       beq
n       beqpuj
v       beQ
v       bergh
n       betleH
n       bey
n       bey'
n       be'
name    be'etor
n       be'Hom
n       be'joy'
n       be'nal
n       be'nI'
n       bID
n       bIghHa'
pro     bIH
n/v     bIj
n       bIm
n       bIng
n       bIQ
n       bIQDep
n       bIQSIp
n       bIQtIq
n       bIQ'a'
v       bIr
n       bIraqlul
n       bIreqtal
n       bIreQtagh
n       bIS'ub
v       bIt
v       bIv
v       bI'
n       bI'rel
n       bo
n       bobcho'
v       boch
n       bochmoHwI'
n       boD
v       bogh
v       boH
v       boj
v       bol
n       bolwI'
n/v     bom
n       bomwI'
adv     bong
n/v     boq
v       boqHa'
n       boqrat
n/v     boQ
n       boQDu'
v       bor
n       borghel
n       bortaS
v       boS
v       bot
n       botjan
n       botlh
n       bov
n       bo'Dagh
n       bo'Degh
n       bo'DIj
v       buD
v       bup
v       buQ
v       bur
n       burgh
v       buS
v       buSHa'
n       butlh
n/v     buv
v       buy'
n       bu'
n       cha
n       chab
n       chach
n       chaDvay'
v       chagh
pro     chaH
n       chaj
n       chal
n       cham
n       chamwI'
n       chan
n       chanDoq
n       chang'eng
n       chap
adv     chaq
v       chaQ
v       char
v       chargh
n       charghwI'
n       chatlh
n/v     chav
n/v     chaw'
ques    chay'
#/v     cha'
n       cha'bIp
n       cha'DIch
n       cha'Do'
n       cha'Hu'
n       cha'leS
adv     cha'logh
n       cha'naS
n       cha'nob
n       cha'par
n       cha'puj
n       cha'pujqut
n       cha'qu'
n       cheb
n       cheb'a'
v       chech
n       chechtlhutlh
v       chegh
v       cheH
n       chej
v       chel
n       chelwI'
n       chemvaH
v       chen
v       chenmoH
n       chenmoHwI'
name    cheng
v       chep
v       cher
v       chergh
n       cheSvel
n       chetvI'
v       chev
v       che'
n       che'ron
adv     chIch
v       chID
v       chIj
n       chIjwI'
v       chIl
v       chIm
v       chIp
n       chIrgh
v       chIS
n       chob
n       chob'a'
n       choghvat
n/v     choH
v       chol
n       choljaH
n       chom
n       chon
n       chonnaQ
n       chontay
v       chong
v       chop
v       choptaH
v       choq
n       choQ
n       chor
n/#     chorgh
n/v     choS
v       chot
n       chotwI'
v       chov
n       chovnatlh
n/v     cho'
n       chuch
v       chuH
v       chuHchu'
v       chun
n       chunDab
v       chung
v       chup
n       chuq
n       chuq'a'
n       chuQun
v       chuS
n       chuS'ugh
n       chut
v       chuv
n       chuvmey
v       chuy
n       chuyDaH
v       chu'
n       chu'wI'
v       Da
v       Dab
v       Dach
n       Daghtuj
adv/n   DaH
n       DaHjaj
v       Daj
v       Dal
v       Dan
n       Dap
n/v     Daq
n       Daqtagh
n       DaQ
n       Dargh
n       DarSeq
n       DaS
n       DaSpu'
n       Dat
v       Dav
n       DavHam
n/v     Daw'
n       DayquS
n       Da'
n       Da'nal
n       Da'vI'
n       Deb
v       Dech
n/v     Degh
n       DeghwI'
v       DeH
v       Dej
v       Del
n       DenIb
n       DenIbngan
n       DenIbya'
n       DenIbya'ngan
n       Dep
n       DeQ
v       Der
n       DeS
n       DeSqIv
v       Dev
n       DevwI'
n       De'
n       De'wI'
n       DI
n       DIb
n       DIch
n       DIghna'
v       DIj
v       DIl
n       DIlyum
v       DIng
n       DIp
n       DIr
n       DIron
n/v     DIS
v       DIv
n       DIvI'
n       DIvI'may'Duj
n       Do
n/v     Doch
n       DoD
v       Dogh
n       Doghjey
v       DoH
v       DoHmoH
v       Doj
n       Dol
n       Dom
v       Don
n       Dop
v       Doq
v       DoQ
v       Dor
n       DoS
n       Dotlh
n       Dov'agh
v       Doy'
n       Doy'yuS
adv/v   Do'
adv/v   Do'Ha'
n/v     Dub
v       DuD
n       DuDwI'
v       Dugh
n/v     DuH
n       Duj
v       Dum
v       Dun
n       Dung
n       DungluQ
n       Dup
n       Duq
v       DuQ
n       DuQwI'
n       DuQwI'Hommey
name    DuraS
n       DuS
n       DuSaQ
v       Duv
n       Duy
n/v     Duy'
n       Duy'a'
n       Du'
n       ghab
v       ghagh
pro     ghaH
v       ghaj
v       ghal
n       gham
n       ghanjaq
n       ghangwI'
conj    ghap
v       ghaq
n/v     ghar
n       ghargh
n       gharwI'
v       ghatlh
name    ghawran
n       ghaw'
adv     ghaytan
adv     ghaytanHa'
excl    ghay'cha'
n       gha'tlhIq
n       gheb
n       gheD
v       ghegh
v       ghel
n       ghem
v       gher
v       gheS
v       ghet
n       ghevI'
n       ghew
n       ghe'naQ
n       ghe'tor
n       ghe''or
v       ghIb
n       ghIch
n       ghIgh
v       ghIH
v       ghIj
n       ghIlaSnoS
v       ghIm
n       ghIntaq
v       ghIpDIj
adv     ghIq
excl    ghIqtal
v       ghIQ
v       ghIr
name    ghIrIlqa'
n       ghISDen
n       ghIt
n/v     ghItlh
n       ghItlhwI'
n       gho
n/v     ghob
excl    ghobe'
n/v     ghoch
name    ghochwI'
v       ghoD
n       ghogh
v       ghoH
v       ghoj
v       ghojmoH
n       ghojmoq
n       ghojwI'
n       ghol
n/v     ghom
v       ghomHa'
n       ghom'a'
n       ghonDoq
n/v     ghong
n       ghop
n       ghopDap
v       ghoq
n       ghoqwI'
v       ghoQ
n/v     ghor
ques    ghorgh
v       ghoS
n       ghot
n       ghotI'
v       ghov
v       gho'
n       gho'Do
n       ghu
n       ghubDaQ
n/v     ghuH
v       ghuHmoH
n/v     ghum
v       ghun
v       ghung
v       ghup
v       ghur
v       ghuS
n       ghuv
excl    ghuy'
excl    ghuy'cha'
n       ghu'
v       Hab
n       HablI'
v       Hach
v       HaD
v       Hagh
v       HaH
v       Haj
n       HajDob
n       Hal
n       HanDogh
n       Hap
n/v     Haq
n       Haqtaj
n       HaqwI'
n       HaQchor
v       Har
v       Hargh
n       HaSta
n/v     Hat
n       Hatlh
v       Haw'
v       Hay'
v       Hay'chu'
excl    Ha'
n       Ha'DIbaH
n       Ha'quj
n       He
v       Hech
v       HeD
n       HeDon
n/v     Hegh
n       Heghbat
n       Heghba'
v       HeghmoH
n       Heghtay
n       HeH
v       Hej
n       HejwI'
v       Hem
v       Heng
v       HeQ
n       Hergh
n       HerghwI'
n/v     HeS
n       HeSwI'
v       Hev
n       Hew
v       He'
v       He'So'
n       HIch
n       HIchDal
n       HIDjolev
v       HIgh
v       HIj
excl    HIja'
n       HIjwI'
n       HIp
n       HIq
excl    HISlaH
v       HIv
n       HIvDuj
n       HIvje'
v       HIvneS
n       HI'
n       HI'tuy
v       Hob
n       Hoch
#       HochDIch
n       HochHom
adv     Hochlogh
n       HoD
n       Hogh
n/v     HoH
v       HoH'egh
v       Hoj
n       Hol
n       HolQeD
n/v     Hom
n       HomwI'
v       Hon
n       Hong
n       Hongghor
v       Hop
n       Hoq
n       Hoqra'
v       HoQ
n/v     HoS
n       HoSchem
n       HoSDo'
v       HoSghaj
v       Hot
v       Hotlh
n       HotlhwI'
n       Hov
n       HovpoH
n       Hovtay'
v       Hoy'
n/v     Ho'
n       Ho''oy'
n       Hu
n/v     Hub
v       HubneS
n       Huch
n       HuchQeD
n       HuD
n       Hugh
n       HuH
v       Huj
v       Hum
n       Human
n       Hung
v       Hup
v       Huq
n       Hur
n       HurDagh
n/v     Hurgh
n       Hur'Iq
n       Hur'Iqngan
name/v  HuS
#       Hut
excl    Hutvagh
v       Hutlh
v       Huv
n       Huy'
n       Huy'Dung
n/v     Hu'
excl    Hu'tegh
v       jab
n       jabbI'ID
n       jabwI'
v       jach
v       jaD
n       jagh
n       jaghla'
v       jaH
n       jaj
n       jajlo'
n       jan
v       jang
v       jaq
v       jaqmoH
n       jar
n       jargh
adv     jaS
n/v     jat
n       jatyIn
v       jatlh
n/#     jav
n/v     jaw
adv     jay'
v       ja'
n/v     ja'chuq
adv/conj        je
n/v     jech
v       jeD
v       jegh
v       jeH
v       jej
v       jejHa'
v       jen
n       jengva'
v       jeq
n       jeqqIj
v       jeQ
v       jer
v       jeS
v       jev
n/v     jey
n       jey'naS
v       je'
n       jIb
n/pro/v jIH
v       jIj
n       jIl
v       jIm
n       jInaq
n       jInmol
n       jIp
v       jIr
v       jIrmoH
v       jIv
n       jo
v       joch
v       joD
n       jogh
n       joH
n       joj
n       jojlu'
n/v     jol
n       jolpat
n       jolpa'
n       jolvoy'
v       jom
v       jon
n       jonpIn
n       jonta'
n       jonwI'
v       jop
conj/v  joq
n       joqwI'
n       joQ
v       jor
n       jorneb
n       jornub
n       jorwI'
n/v     joS
v       jot
v       jotHa'
v       jotlh
v       joy'
n       jo'
v       jub
v       jubbe'
v       juch
n       juH
n       juHqo'
v       jum
v       jun
n       jup
v       juS
v       juv
v       lab
v       lach
v       laD
n/v     lagh
n       laH
n/v     laj
v       lajQo'
n       lalDan
n/v     lam
v       lan
v       lang
v       laq
v       laQ
v       largh
n       laSvargh
n       lat
n       latlh
n       lav
v       law'
v       lay'
v       lay'Ha'
n       la'
n       la'quv
n       la''a'
v       legh
n/v     leH
v       lel
n       lem
n       len
n/v     leng
n       lengwI'
n       leQ
n/v     leS
n       leSpal
n       leSpoH
n       leSSov
v       let
n       letlh
v       lev
n       ley'
v       le'
v       le'be'
v       lIch
v       lIgh
n       lIghon
v       lIH
v       lIj
v       lIm
n       lInDab
v       lIng
n       lIngta'
n       lIngwI'
v       lIq
n       lIr
v       lIS
v       lIt
v       lItHa'
n       lIw
n       lIy
v       lI'
v       lob
v       lobHa'
n       loch
n       loD
n       loDHom
n       loDnal
n       loDnI'
n       logh
n       loghqam
n/v     loH
v       loj
n       lojmIt
n/v     lol
v       lolchu'
v       lolchu'taH
v       lolmoH
n       lolSeHcha
v       loltaH
n       lom
v       lon
n/v     lop
n       lopno'
adv     loQ
n       lor
n       lorbe'
n       lorloD
n/#/v   loS
n       loSpev
n       lot
v       lotlh
n       lotlhmoq
n       lotlhwI'
v       loy
n/v     lo'
v       lo'laH
v       lo'laHbe'
n       lo'laHbe'ghach
n       lo'laHghach
v       lu
n       luch
v       lugh
n/v     luH
v       luj
v       lul
n       lulIgh
v       lum
n       lung
n/v     lup
n       lupDujHom
n       lupwI'
excl    luq
n       lur
n       lurDech
n       lurgh
name    lurSa'
n       luSpet
n       lut
v       lutlh
excl    lu'
n       mab
v       mach
v       magh
n       maghwI'
pro     maH
n       maHpIn
excl    maj
excl    majQa'
n       malja'
n       mang
n       mangghom
n       mangHom
v       maq
n       maqoch
n       maQmIgh
v       mar
name    mara
name    martaq
n       marwI'
n/v     maS
n       maSwov
n       matHa'
name/v  matlh
v       matlhHa'
n       mavje'
n       mavjop
v       maw
v       maw'
v       may
n       may'
n       may'Duj
n       may'luch
n       may'morgh
n       may'ron
v       ma'
n       ma'veq
n       meb
n       mebpa'mey
v       mech
n       megh
n       meH
v       mej
n       melchoQ
name    mellota'
n       mem
n       mep
n/v     meq
n       meqba'
n       meqleH
n       meqro'vaq
v       meQ
v       mer
n       meSchuS
v       mev
excl    mevyap
n       me'
n       me'nal
n       mIch
n       mID
v       mIgh
v       mIl
n       mIl'oD
v       mIm
n       mIn
n/v     mIp
n       mIqta'
n/v     mIQ
n       mIr
n/v     mIS
v       mISmoH
name    mIStaq
n       mIv
n       mIv'a'
n       mIw
v       mIy
n/v     mI'
v       mob
n       moch
v       moD
name/v  mogh
v       moH
n       moHaq
v       moj
n       mojaq
n       mojaQ
n/v     mol
n/v     mon
n       mong
n       mongDech
n       mop
v       moq
n       moQ
n       moQbara'
v       morgh
v       moS
adv/v   motlh
v       motlhbe'
n       mov
n       moy'bI'
n       mo'
v       mub
n/v     much
n       muchwI'
n       muD
v       mugh
n       mughato'
n       mughwI'
v       muH
v       muj
v       mul
v       mum
v       mun
n       mung
v       mup
n       mupwI'
n       mupwI'Hom
v       muq
v       muS
n/v     mut
v       muv
v       muvmoH
n       muvtay
n       mu'
n       mu'ghom
n       mu'qaD
n       mu'tay'
n       mu'tlhegh
n/v     nab
n       nach
n/v     naD
n       naDev
v       naDHa'
n       naDHa'ghach
n       naDqa'ghach
n       nagh
n       naghboch
n       naH
n       naHjej
n       naHlet
n       naHnagh
v       naj
n       najmoHwI'
n       nalqaD
n       namwech
v       nan
n       nanwI'
v       nap
n/v     naQ
n       naQHom
n       naQjej
v       nargh
v       naS
v       natlh
n       nav
n       nawlogh
n/v     naw'
v       nay
n       nay'
v       na'
n       na'ran
n       neb
v       nech
n       negh
adv/v   neH
n       neHjej
n       neHmaH
v       nej
n       nejwI'
n       nem
n/v     nen
v       nenchoH
n       nentay
n       nenghep
v       nep
n       nepwI'
n       neSlo'
pro     net
n       nevDagh
n       ne'
v       nIb
n       nIbpoH
n       nIch
v       nID
n/v     nIH
n       nIHwI'
v       nIj
n       nIm
n       nIn
n       nIQ
v       nIS
n       nISwI'
v       nIt
adv     nIteb
adv     nItebHa'
n       nItlh
n       nItlhpach
v       nIv
n       nIvnav
v       nIvqu'
v       nI'
n/v     nob
v       nobHa'
n       noch
v       noD
v       nogh
n/v     noH
v       noj
n       nol
adv     nom
v       non
v       nong
v       nop
n       norgh
v       noS
n       noSvagh
adv     not
n       notqa'
v       notlh
n/v     nov
v       noy
n       no'
n       no''och
v       nub
n       nubwI'
n       nuch
v       nuD
n       nugh
v       nughI'
n       nuH
n       nuHHom
n       nuHmey
n       nuHpIn
n       nuj
v       num
v       nung
v       nup
ques    nuq
ques    nuqDaq
excl    nuqjatlh
excl    nuqneH
v       nuQ
n       nur
n       nural
n       nuralngan
v       nuS
n       nuv
v       ngab
v       ngach
v       ngaD
v       ngaDmoH
n       ngaDmoHwI'
v       ngagh
v       ngaj
v       ngal
n       ngan
n       ngaq
v       ngaQ
v       ngaS
n       ngat
n       ngav
n       ngawDeq
v       nga'chuq
v       ngeb
n       ngech
v       ngeD
v       ngeH
n       ngeHbej
v       ngej
n       ngem
n       ngeng
v       ngep
n       ngep'oS
v       ngeQ
n       nger
v       ngev
v       nge'
n       ngIb
v       ngIj
v       ngIl
v       ngIm
v       ngIp
v       ngIv
v       ngI'
n       ngoch
n       ngoD
v       ngoH
v       ngoj
v       ngol
n/v     ngong
n       ngop
n       ngoq
n       ngoqDe'
n       ngoQ
v       ngor
v       ngoS
v       ngotlh
v       ngoy'
v       ngo'
adv     ngugh
n       ngujlep
v       ngun
n       ngup
v       nguq
n       nguSDI'
v       nguv
v       nguvmoH
v       ngu'
n/v     pab
v       pabHa'
n       pach
conj/n/#  pagh
adv     paghlogh
n       paH
v       paj
v       pang
n       paq
n       paQDI'norgh
v       par
n       parbIng
v       parHa'
n       parmaq
n       parmaqqay
v       paS
n       paSlogh
n       pat
n       patlh
v       pav
v       paw
v       paw'
v       pay
adv     pay'
n       pa'
n       peb'ot
v       peD
n/v     pegh
n       peHghep
v       pej
n       pel'aQ
n       pem
n       pemjep
n       peng
v       pep
n       peQ
n/v     per
excl    petaQ
n       pey
v       pe'
adv     pe'vIl
v       pe''egh
n/v     pIch
v       pID
n       pIgh
v       pIH
adv     pIj
adv     pIjHa'
v       pIl
v       pIlmoH
v       pIm
n       pIn
n       pIn'a'
n       pIp
n       pIpyuS
n       pIq
n       pIqaD
n       pIrmuS
excl    pItlh
v       pIv
n       pIvchem
n       pIvghor
n       pIvlob
n       pIw
v       pI'
n       po
n       pob
v       poch
v       poD
v       poDmoH
n       pogh
n/v     poH
n/v     poj
v       pol
v       polHa'
n       pom
v       pon
n/v     pong
n       pop
n       poq
v       poQ
n       por
n       porgh
n       porghQeD
n/v     poS
v       poSmoH
n/v     potlh
n/v     pov
v       po'
v       pub
n       puch
n       puchpa'
n       pugh
n       puH
v       puj
v       pujmoH
n       pujwI'
n/v     pum
v       pummoH
n       pung
v       pup
n       puq
n       puqbe'
n       puqloD
n       puqnI'
n       puqnI'be'
n       puqnI'loD
v       puQ
v       pur
v       puS
v       puv
v       puy
n       puyjaq
n       pu'
n       pu'beH
n       pu'bej
n       pu'beq
n       pu'DaH
n       pu'HIch
n/v     qab
n       qach
n/v     qaD
n/v     qagh
n       qaH
v       qaj
n       qajunpaQ
v       qal
v       qalmoH
n       qam
n       qama'
name    qamor
v       qan
n       qanraD
n       qanwI'
v       qang
v       qap
v       qaq
v       qar
n       qarDaS
n       qarDaSngan
name    qarghan
n       qaryoq
n       qaryoq'a'
v       qaS
v       qat
ques    qatlh
v       qaw
n       qawHaq
v       qawmoH
v       qay
n       qaywI'
v       qay'
n       qa'
n       qa'meH
n       qa'rol
n       qa'vam
n       qa'vaQ
n       qa'vIn
v       qeb
n       qech
v       qeD
n       qegh
v       qeH
v       qej
v       qel
n       qelI'qam
v       qem
n       qempa'
adv     qen
name/v  qeng
n       qep
n/v     qeq
n/v     qeS
v       qet
n       qettlhup
v       qetlh
n/v     qev
n       qevaS
n       qevpob
v       qew
n       qewwI'
name    qeylIS
n       qIb
n       qIbHeS
v       qIch
n/v     qID
n       qIgh
v       qIH
v       qIj
v       qIl
v       qIm
v       qImHa'
name    qImlaq
v       qIp
v       qIQ
name    qIrq
v       qIt
n       qItI'nga'
n       qIv
n       qIvon
n       qIvo'rIt
v       qI'
name    qI'empeq
n       qoch
n       qoD
n       qogh
n       qoH
conj/n  qoj
name    qolotlh
n       qompogh
v       qon
n       qonwI'
v       qop
n       qoq
name/v  qor
n       qorDu'
name    qoreQ
n       qoS
v       qotlh
v       qoy'
n       qo'
name    qo'leq
n       qo'qaD
v       qub
v       quch
n       quD
v       qugh
n       qughDo
n       qughDuj
n       quH
n       quHvaj
n       qul
n/v     qum
n       qumwI'
n/v     qun
n       qung
n       qup
n       quprIp
v       quq
v       qur
n       qurgh
n       quS
n       qut
n       qutluch
v       qutlh
n/v     quv
v       quvHa'
n       quvHa'ghach
v       quvHa'moH
v       quvmoH
n       quy'Ip
v       qu'
n       Qab
v       Qach
v       QaD
n/v     Qagh
n/v     QaH
n       Qaj
v       Qam
v       Qan
n       Qang
v       Qap
n       Qapla'
v       Qaq
v       QaQ
n       Qargh
n/name  QaS
v       Qat
v       Qatlh
v       Qav
v       Qaw'
v       Qay
v       Qay'
n       Qay'wI'
n       Qa'
n       Qa'Hom
n       Qa'raj
n       Qeb
n       QeD
n       QeDpIn
n/v     QeH
n/name  Qel
n       Qenvob
n       Qep'It
v       Qeq
v       Qev
v       Qey
v       QeyHa'
v       QeyHa'moH
v       QeymoH
n       Qe'
n       QIb
n       QIch
v       QID
n       QIghpej
n/v     QIH
v       QIj
n       QIm
n       QIn
v       QIp
n       QIS
adv     QIt
v       QIv
n       QI'
n       QI'lop
n       QI'tomer
n       QI'tu'
excl    QI'yaH
n/v     Qob
v       Qoch
v       Qochbe'
v       QoD
n       Qogh
n       QoghIj
v       Qoj
v       Qol
v       Qom
n       QonoS
v       Qong
n       QongDaq
v       Qop
v       QopmoH
n       QoQ
v       Qor
v       Qorgh
n       Qorwagh
v       QoS
v       Qot
name    Qotmagh
v       Qotlh
excl    Qovpatlh
v       Qoy
excl    Qo'
n       Qo'noS
v       Qub
n/v     Quch
v       QuchHa'
n       QuD
n/name  Qugh
n/v     Quj
v       Qul
n       Qulpa'
n/v     Qum
n       QumpIn
n       QumwI'
n       Qun
v       Qup
n       QuQ
n/v     QuS
v       Qut
v       Qutlh
n       Quv
n       Qu'
excl    Qu'vatlh
v       rach
n       rachwI'
v       raD
v       ragh
n       raHta'
v       ral
n/v     ram
n       ramjep
v       rap
n/v     raQ
n       raQpo'
v       rar
n       raS
v       ratlh
n       rav
n       rav'eq
n       raw'
n       ray'
v       ra'
n       ra'ghomquv
n       ra'taj
n       ra'wI'
v       rech
n       reD
v       regh
n       reghuluS
n       reghuluSngan
adv/v   reH
n       rejmorgh
n       rep
n       ret
n       ret'aq
n       retlh
n       rewbe'
v       rey
v       rIgh
v       rIH
n       rIHwI'
v       rIl
n       rIlwI'
v       rIn
n       rIp
v       rIQ
v       rIQmoH
n       rItlh
n       rIvSo'
n       rIymuS
v       rI'
n       rI'Se'
n       ro
adv     roD
v       rogh
v       roghmoH
n       roghvaH
n/v     roj
n       rojHom
n       rojmab
n       rol
n       rom
n       romuluS
n       romuluSngan
v       ron
n/v     rop
v       ropchoH
n       ropyaH
v       roQ
v       ror
v       roS
v       roSHa'moH
n       roSwI'
v       rotlh
n       ro'
n       ro'qegh'Iwchab
v       ruch
n       rugh
v       run
n       runpI'
v       rup
v       ruq
n/name  ruq'e'vet
v       ruQ
v       rur
n       ruStay
adv     rut
n       rutlh
n       ruv
v       ru'
v       ru'Ha'
v       Sab
v       Sach
v       Sagh
v       SaH
n       Saj
v       Sal
v       Sam
n       San
v       Sang
v       Sap
v       Saq
n       Saqghom
n       Saqjan
v       SaQ
n/v     Sar
n       Sargh
v       SaS
n       Satlh
v       Saw
v       Saw'
v       Say'
v       Say'qu'moH
n       Sa'
n       Sech
n       SeDveq
n       Segh
v       SeH
n       SeHlaw
v       Sen
n       SenwI'
n/v     Seng
n/v     Sep
n       Separ
n       Seq
v       SeQ
n       Ser
n       SermanyuQ
n       Serrum
n       SeS
n/v     Sev
v       Sey
v       SeymoH
n       Se'
n       SIbDoH
adv     SIbI'
v       SIch
n       SID
v       SIgh
v       SIH
v       SIj
n       SIjwI'
n       SIla'
v       SIm
n       SIp
v       SIq
n       SIqwI'
v       SIQ
n       SIQwI'
n       SIrgh
v       SIS
v       SIv
n/#     Soch
n/v     SoD
n       Sogh
pro     SoH
n       Soj
v       Sol
n       Som
n       Somraw
v       Son
n       SonchIy
v       Sop
n       SopwI'pa'
n/v     SoQ
v       SoQmoH
n       Sor
v       Sorgh
n       Sorya'
n       SoS
n       SoSbor
n       SoSbor'a'
n       SoSnI'
v       Sot
n       Sotlaw'
n/v     Sov
v       Soy'
v       So'
n       So'wI'
n/v     Sub
v       Such
v       SuD
v       Sugh
excl    SuH
v       Suj
v       Sum
n       Sun
n       Sung
n/v     Sup
n       Supghew
v       Suq
v       Suqqa'
v       SuQ
n       Surchem
v       Surgh
n/v     SuS
n       SuSDeq
n       Sut
v       Sutlh
v       Suv
v       Suvchu'
n       SuvwI'
n       Suy
n       SuyDuj
n       Suy'
excl    Su'
n       Su'lop
n       ta
n       tach
v       taD
v       taDmoH
n/v     tagh
adv     tagha'
v       taH
excl    taHqeq
n       taj
n       tajHommey
n       tajtIq
n       tajvaj
n       tal
n       talarngan
v       tam
v       tammoH
n       tangqa'
v       tap
n       taq'ev
v       taQ
n       taQbang
n       tar
n       targh
n       taS
n       tat
v       tatlh
n/v     tay
v       taymoH
n       tayqeq
v       tay'
n/v     ta'
v       teb
n       teblaw'
n       tebwI'
n       teghbat
v       teH
n       tej
n       tel
v       tem
v       ten
n       tennuS
n       tennuSnal
n       tengchaH
n       tep
n       tepqengwI'
v       teq
n       tera'
n       tera'ngan
n       teS
v       tet
n       tetlh
n       tev
v       tey
n       teywI'
n/v     tey'
n       tey'be'
n       tey'loD
n       tI
v       tIb
v       tIch
n       tIgh
n       tIH
v       tIj
n       tIjwI'
n       tIjwI'ghom
v       tIl
v       tIn
n       tIng
n       tIngDagh
n/v     tIq
n       tIqnagh
v       tIQ
n       tIr
v       tIS
v       tIv
v       tI'
name    tI'ang
name    tI'vIS
v       tob
n       toch
n/v     toD
n       toDDuj
excl    toDSaH
n       toDuj
v       togh
excl    toH
v       toj
n       tonSaw'
n       tongDuj
n       toplIn
n       toppa'
v       toq
n       toQ
n       toQDuj
v       tor
name    torgh
v       toS
n       totlh
n       tova'Daq
v       toy'
n       toy'wI'
n       toy'wI''a'
n       to'
n       to'baj
n       to'waQ
v       tuch
adv     tugh
n/v     tuH
v       tuHmoH
n/v     tuj
v       tul
n       tum
v       tun
v       tung
v       tungHa'
n       tup
n       tuq
n       tuqnIgh
n       tuqvol
v       tuQ
n       tuQDoq
v       tuQHa'moH
v       tuQmoH
v       tuS
n       tut
v       tuv
v       tuy'
v       tu'
n       tu'HomI'raH
n       tu'lum
v       tu'lu'
n/v     tlhab
n       tlhach
n       tlhagh
n       tlham
v       tlhap
n       tlhaq
v       tlhaQ
n       tlharghDuj
v       tlhaS
n       tlhatlh
v       tlhaw'
n       tlhay
v       tlha'
name    tlha'a
v       tlheD
n       tlhegh
v       tlhej
n       tlhepQe'
v       tlher
v       tlhetlh
n       tlhevjaQ
v       tlhe'
v       tlhIb
n       tlhIch
pro     tlhIH
v       tlhIj
n/v     tlhIl
n       tlhIlHal
n       tlhIlwI'
n       tlhImqaH
n       tlhIngan
n       tlhIq
v       tlhIS
v       tlhIv
v       tlhob
v       tlhoch
n       tlhogh
v       tlhoj
v       tlhol
n       tlhombuS
n       tlhon
v       tlhong
n       tlhop
n       tlhoQ
v       tlhorgh
v       tlhorghHa'
adv     tlhoS
v       tlhot
v       tlhov
adv     tlhoy
n       tlhoy'
n/v     tlho'
n       tlho'ren
v       tlhuch
v       tlhuD
n/v     tlhuH
v       tlhup
n       tlhuQ
v       tlhutlh
v       tlhu'
v       tlhu'moH
excl    va
v       vaD
n/#     vagh
n       vaH
n       vaHbo'
adv/n   vaj
v       val
name    valQIS
n/v     van
n       van'a'
v       vang
v       vaq
v       vaQ
n       vaS
n       vaS'a'
n       vatlhvI'
n       vav
n       vavnI'
v       vay
n       vay'
v       veb
n       veD
n       veDDIr
v       vegh
n       veH
v       vem
v       vemmoH
n       vem'eq
n       veng
n       vengHom
n       veqlargh
n       veQ
n       veQDuj
n       veragh
n       verengan
n/v     vergh
n       veS
n       veSDuj
n       vetlh
v       vID
n       vID'Ir
n       vIghro'
v       vIH
n       vIj
n       vIlInHoD
n       vIn
v       vIng
n       vIq
name    vIqSIS
n/v     vIt
n       vItHay'
n       vIttlhegh
n       vIychorgh
n/v     vI'
n       voDleH
n       vogh
n       voHDajbo'
n       volchaH
v       von
v       vonlu'
v       vong
v       voq
v       voqHa'
v       voQ
n       voQSIp
v       vor
v       vo'
n       vub
n       vuD
v       vul
v       vulchoH
n       vulqan
n       vulqangan
v       vum
v       vup
v       vuQ
v       vuS
v       vut
n       vutpa'
n       vut'un
v       vuv
v       vu'
n       vu'wI'
n       wab
v       wagh
v       waH
v       wam
n       wamwI'
n       wanI'
n       waq
n       waqboch
n/v     waQ
n       warjun
v       watlh
v       wav
n       waw'
v       way'
#       wa'
n       wa'Hu'
n       wa'leS
adv     wa'logh
#       wa'maH
v       web
v       wech
v       wegh
v       weH
adv/#   wej
excl    wejpuH
n/v     wem
n       wen
n       wep
v       weq
n       weQ
v       wew
n       wey
v       wIb
n       wIch
n       wIgh
v       wIH
v       wIj
v       wItlh
n/v     wIv
n       wIy
v       wob
v       woD
v       woH
n/v     woj
v       wom
n       woQ
n       wornagh
n       woS
n       wot
v       wov
n       wovmoHwI'
n       wo'
name    wo'rIv
v       wuD
v       wup
v       wuq
v       wuQ
n       wuS
n       wutlh
v       wuv
n       ya
n       yab
v       yach
n       yaD
n       yagh
n/v     yaH
v       yaj
v       yajHa'
n/v     yan
n       yanwI'
v       yap
n       yaS
n       yatqap
v       yatlh
n       yav
n       yay
v       yay'
n       yeb
n       yej
n       yejHaD
n       yejquv
n       yej'an
v       yem
v       yep
v       yepHa'
v       yeq
n       yer
n       yergho
v       yev
n       yIb
n       yIH
n/v     yIn
n       yInroH
n       yInSIp
excl/n  yIntagh
v       yIQ
n       yIrIDngan
v       yIt
v       yIv
n       yIvbeH
v       yob
n/v     yoD
v       yoD'egh
v       yoH
n       yoHwI'
n       yoj
n       yol
v       yon
v       yonmoH
v       yong
n       yopwaH
n       yoq
n       yor
n       yoS
n/v     yot
n       yotlh
v       yov
v       yoy
n       yo'
n       yu
n       yub
n       yuch
v       yuD
v       yuDHa'
n       yupma'
n       yuQ
n       yuQHom
n       yuQjIjDIvI'
n       yuQjIjQa'
n       yur
v       yuv
n       yuvtlhe'
v       yu'
n       yu'egh
conj    'a
v       'ab
conj    'ach
n/v     'aD
v       'agh
n       'aH
n       'aj
n       'alngegh
n       'ampaS
v       'ang
n       'aqleH
n       'aqnaw
n       'aqroS
name    'aqtu'
n       'aQlo'
ques    'ar
v       'argh
ques    'arlogh
name    'atrom
n       'atlhqam
v       'av
n       'avwI'
n       'awje'
v       'aw'
n       'ay'
n       'eb
n       'ech
n       'eDjen
n       'eDSeHcha
n       'egh
excl    'eH
conj    'ej
n       'ejDo'
n       'ejyo'
n       'ejyo'waw'
v       'el
n       'elaS
n       'elpI'
n/v     'em
name    'entepray'
n       'eng
v       'ep
v       'eq
n       'er
v       'eS
n       'et
n       'etlh
n       'ev
n       'evnagh
v       'ey
pro     'e'
n       'e'mam
n       'e'mamnal
n       'e'nal
n       'Ib
v       'Igh
n       'IghvaH
v       'IH
v       'Ij
v       'Il
v       'Im
n       'In
n/v     'Ip
v       'Iq
n       'IqnaH
v       'IQ
n       'IrneH
n       'IrneHnal
n       'ISjaH
v       'It
v       'Itlh
n/ques  'Iv
n       'Iw
n       'Iwghargh
n       'I'
n       'obe'
n       'obmaQ
n       'och
v       'oD
n       'oDwI'
v       'ogh
pro     'oH
v       'oj
v       'ol
v       'om
v       'ong
n       'op
n       'oQqar
v       'or
n       'orghen
n       'orghenya'
n       'orghenya'ngan
n       'orghengan
n       'orwI'
v       'oS
n       'oSwI'
n       'otlh
v       'ov
n/v     'oy'
n       'oy'naQ
n       'o'
n       'o'lav
v       'uch
n       'uD
n       'uD'a'
v       'ugh
v       'uH
n       'uj
n       'ul
v       'um
n       'un
v       'up
n       'uQ
n       'uQ'a'
v       'ur
n       'urmang
n       'urwI'
n       'uS
n       'uSgheb
n       'uSu'
v       'ut
n       'utlh
v       'uy
n       'u'
