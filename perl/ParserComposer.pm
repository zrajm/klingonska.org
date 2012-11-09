package ParserComposer;

use 5.10.0;
use strict;
use warnings;
#use Carp "carp";
use Carp 'verbose';

{
    package arg;
    my @suf = qw(th st nd rd th th th th th th);
    my %test = (
        listref            => sub { ref(shift()) eq "ARRAY" },
        class              => sub {     shift()  eq (caller(1))[0] },
        hashref            => sub { ref(shift()) eq "HASH" },
        hashref_or_file    => sub { my $x = shift(); ref($x) eq "HASH" or -e $x },
        object             => sub { ref(shift()) eq (caller(1))[0] },
        string             => sub { ref(shift()) eq "" },
        string_or_listref  => sub { my $x = shift(); ref($x) eq ""  or ref($x) eq "ARRAY" },
    );

    sub mywarn {
        my ($msg, $stacklevel) = (@_, 0);
        my ($file, $line, $sub) = mycaller($stacklevel+1 || 1);
        warn "$msg to $sub(), at $file line $line\n";
    }

    sub mycaller {
        my ($level) = @_;
        my ($pack, $file, $line, $sub) = caller($level+1);
        $sub =~ s{^main::}{};
        return ($file, $line, $sub);
    }

    # Usage: @ARGS = test(@ARGS, [ @MANDATORY ], [ @OPTIONAL ]);
    #
    # Check that each of @ARGS are of the data types specified by @MANDADORY,
    # and @OPTIONAL, return @ARGS on success, empty list on failure.
    #
    # @MANDATORY and @OPTIONAL are two lists consisting of the strings
    # "listref", "class", "hashref", "object" or "string" in any order,
    # specifying what the argument of the same position should have as type.
    #
    # It requires that the number of elements is at least the same as in
    # @MANDATORY, but no longer that the number of elements in @MANDATORY and
    # @OPTIONAL put together.
    #
    # A warning is outputted on STDERR for each failed test.
    sub test (\@$;$) {
        my ($argref, $defref, $optref) = (@_, []);
        warn "required arg not listref" if ref($defref) ne "ARRAY";
        warn "optional arg not listref" if ref($optref) ne "ARRAY" && @_ > 2;
        warn "to many arguments\n" if @_ > 3;
        my $bad = 0;
        if (@$argref < @$defref) {
            my ($file, $line, $sub) = mycaller(0);
            warn "not enough args to $sub(), at $file line $line\n";
            $bad ++;
        } elsif (@$argref > @$defref + @$optref) {
            my ($file, $line, $sub) = mycaller(1);
            warn "too many args to $sub(), at $file line $line\n";
            $bad ++;
        }
        # test args
        my @def = (@$defref, @$optref);
        my $max = $#$argref > $#def ? $#def : $#$argref;
        foreach (0..$max) {
            if (not exists($test{$def[$_]})) {  # unknown data type
                my ($file, $line, $sub) = mycaller(0);
                warn "unknown data type '$def[$_]' in 2nd arg ",
                  "to $sub(), at $file line $line\n";
                $bad ++;
                next;
            }
            if (not $test{$def[$_]}($argref->[$_])) {  # arg of wrong data type
                my ($file, $line, $sub) = mycaller(1);
                warn "expected '$def[$_]' but got ",
                  (defined($argref->[$_]) ? "'$argref->[$_]'" : "undef"),
                  " in ", $_ + 1,
                  $suf[substr($_ + 1, -1)],
                  " arg to $sub(), at $file line $line\n";
                $bad ++;
                next;
            }
        }
        return () if $bad;
        return @$argref;
    }

    1;
}

# whole list from listref
sub list { @{shift()} }

# 1st element from listref
sub first { ${shift()}[0] }

# 2nd element from listref
sub second { ${shift()}[1] }

# all but 1st element from listref
sub tail { my @x = @{shift()}; shift(@x); @x }

# true if called with string
sub is_string { ref(shift()) eq "" }

# true if called with listref
sub is_list { ref(shift()) eq "ARRAY" }


# Add newline after each argument
sub nl { join("\n", @_) . "\n" }

# Usage: $TEXT = wrap($TEXT, $WIDTH_1ST, $WIDTH);
# Usage: $TEXT = wrap($TEXT, $WIDTH);
# Usage: $TEXT = wrap($TEXT);
#
# Wordwrap $TEXT. Newlines & multiple spaces are removed, and spaces are
# replaced with newlines where required to wrap text at $WIDTH. If two $WIDTHs
# are supplied the 1st one will be used only for the 1st line, and the second
# one for all subsequent lines. If no $WIDTH is specified, a width of 79 is
# assumed.
sub wrap {
    my ($text, $width1, $width2) = (@_);
    $width1 = 79      unless defined($width1);
    $width2 = $width1 unless defined($width2); # use same for 1st & other
    for ($text) {
        s{ \s+ }{ }xg;                         # remove duplicate space/newline
        s{ (.{1,$width1})(\s+|\z) }{$1\n}x;
        substr($_, $+[0] + 1) =~
            s{ (.{1,$width2})(\s+|\z) }{$1\n}xg;
        s{\n\z}{};
    }
    return $text;
}

# Usage: $TEXT = center($TEXT, $WIDTH);
#
# Centers all lines in $TEXT, by inserting spaces at the begginning of the
# line. Lines in $TEXT longer than $WIDTH characters will not be affected.
# 
sub center {
    my ($text, $width) = (@_);
    $text =~ s{ ^ (?= (.+)$) }{
        " " x int(($width - length($1)) / 2);
    }gemx;
    return $text;
}

sub regex($$;$) {
    my ($text, $regex, $subst) = (@_, "");
    $text =~ s{$regex}{$subst}ge;
    return $text;
}


sub mycarp {
    my ($msg) = @_;
    my ($pack, $file, $line, $sub) = caller(2);
    $msg =~ /\n$/ or $msg .= ", at $file line $line\n";
    die "$sub(): $msg";
}

# Usage: $RESULT = load_source($PERL_FILE);
#
# Loads $PERL_FILE, returns whatever is the result of its execution. It is here
# used to load parser/composer data, which means that the file loaded must
# return a hash reference to a data structure.
sub load_source {
    my ($self, $file) = @_;
    my $ref = do $file;           # lexicals in surrounding scope not visible
    if (not defined($ref)) {
        die "Failed to open file '$file' for reading: $!\n" if $!;
        die "Failed to load file '$file' code content: $@\n" if $@;
    }
    return $ref;
}

# Usage: $OBJ = new ParserComposer(
#     parser      => $HASHREF,
#     composer    => $HASHREF,
#     transformer => $HASHREF,
# );
sub new {
    my ($class, %opt) = @_;
    die "new(): Not called as constructor" unless $class eq __PACKAGE__;
    $opt{composer}    //= {}; # default value
    $opt{transformer} //= {}; # default value

    # load from files if filenames where given
    my $self = bless({}, $class);
    foreach (qw(parser transformer composer)) {
        next if ref($opt{$_}) eq "HASH";
        my $file = $opt{$_};
        die "Failed to load $_: No such file '$file'"  unless -e $file;
        $opt{$_} = $self->load_source($file);
        die "Failed to load $_: Source did not return hashref in file '$file'\n"
            unless ref($opt{$_}) eq "HASH";
        $self->{$_} = $opt{$_};
    }
    return $self;
}

# Usage: ($POS, @SUBSTRING) = match($TEXT, $REGEX, $POS);
# Usage:        @SUBSTRING  = match($TEXT, $REGEX);
#
# Returns 1st match of $REGEX in $TEXT. If $POS is given search begin at that
# position in $TEXT (and "\G" may be used to match there), and a $POS is
# returned indicating where any found match ended.
#
# If no match is found, returns the empty list (), regardless of whether $POS
# was given or not.
sub match {
    my ($text, $regex, $pos) = @_;
    pos($text) = defined($pos) ? $pos : 0;
    # In list context, "/g"-modifier causes regex to match several times when
    # possible, and we never want that, so we have to call it in scalar
    # context here.
    if ($text =~ m/\G$regex/gc) {
        # ($1, $2, $3, etc.)
        return (defined($pos) ? pos($text) : ()),
          map {
              defined($-[$_]) ?
                  substr($text, $-[$_], $+[$_] - $-[$_]) :
                  undef;
          } (1..$#+);
    }
    return ();
}

# # Usage: ($POS, @SUBSTRING) = match($TEXT, $REGEX, $POS);
# # Usage:        @SUBSTRING  = match($TEXT, $REGEX);
# #
# # Returns 1st match of $REGEX in $TEXT. If $POS is given search begin at that
# # position in $TEXT (and "\G" may be used to match there), and a $POS is
# # returned indicating where any found match ended.
# #
# # If no match is found, returns the empty list (), regardless of whether $POS
# # was given or not.
# sub match {
#     my ($text, $regex, $pos) = @_;
#     pos($text) = defined($pos) ? $pos : 0;
#     # In list context, "/g"-modifier causes regex to match several times when
#     # possible, and we never want that, so we have to call it in scalar
#     # context here.
#     if ($text =~ m/\G$regex/gc) {
#         # ($1, $2, $3, etc.)
#         return (defined($pos) ? pos($text) : ()),
#           map { substr($text, $-[$_], $+[$_] - $-[$_]) } (1..$#+);
#     }
#     return ();
# }

# Usage: $TEXT = indent($TEXT, $PREFIX_1ST, $PREFIX);
# Usage: $TEXT = indent($TEXT, $PREFIX);
# Usage: $TEXT = indent($TEXT);
#
# Indent every line in $TEXT with $PREFIX. If two prefixes are specified, the
# first prefix will be used for the first line in $TEXT, and the second $PREFIX
# will be used for all subsequent lines. (E.g. for a bullet point you might
# want to use '$TEXT = indent($TEXT, " * ", " ")' or similar).
sub indent {
    my ($text, $prefix1, $prefix2) = (@_);
    $prefix1 = ""       unless defined($prefix1);# default prefix = ""
    $prefix2 = $prefix1 unless defined($prefix2);# use same for 1st & other
    $text =~ s{ (?<!\A)^ }{$prefix2}xgm;       # indent all but 1st line
    return $prefix1 . $text;
}

# Usage: $TEXT = underline($TEXT, $CHAR);
#
# Underline by adding a line of $CHAR, with same length as $TEXT. $TEXT is
# assumed to consist of a single line of text. $CHAR is typically "=" or "-".
sub underline {
    my ($text, $char) = @_;
    return $text . "\n" .
      ($char x length($text));
}

# Usage: $HYPHENATED = hyphenate_tlh($TEXT, $HYPHEN[, $HARD_HYPHEN ]);
#
# Insert $HYPHEN between each klingon syllable in $TEXT. $HYPHEN need not be a
# single character (e.g. in HTML a good hyphen is "&shy;").
#
# If $HARD_HYPHEN is given, then all occurances of "-" is replaced with with
# that (the HTML/UTF8 hard hyphen entity is "&#8209;"). Unless this is used, a
# line break may be inserted after any occuring hyphen this looks esp. ugly
# when a string like "-moH" accurs in in text and is rendered with a linebreak
# between "-" and "m". (NOTE: Don't use "-" as $HYPHEN, if you specify a
# $HARD_HYPHEN -- if you do this, then all hyphens will become $HARD_HYPHENs).
sub hyphenate_tlh($$;$) {
    my ($text, $hyphen, $hard_hyphen) = @_;
    my $cons = "tlh|ch|gh|ng|[bDHjlmnpqQrStv']";# consonants (except {w} and {y})
    my $syll = qr{                              #
      (?:                                       #
        (?:                                     #
          (?: $cons | [wy] )                    # onset (any consonant)
          (?:                                   # nucleus
            [aeI] (?: $cons | rgh | [yw]'? )? | #   (a/e/I) + coda (consonant)
            [ou]  (?: $cons | rgh |  y  '? )?   #   (o/u)   + coda (consonant)
          )                                     #
        ) | oy                                  # or possibly just 'oy'
      )}x;                                      #
    for ($text) {
        s{ ($syll) (?=$syll) }{$1$hyphen}xg;
        s{-}{$hard_hyphen}g if defined($hard_hyphen);
    }
    return $text;
}

# Usage: $OUTPUT = process($CONTEXT, $TEXT);
#
# Applies any processor defined for $CONTEXT on $TEXT and returns the
# result. If no processor is defined $TEXT is returned unmodified.
sub preprocess {
    my ($self, $context, $text) = arg::test(@_, [ qw(object string string) ])
      or return ();
    return $text unless exists($self->{processor}{$context});
    return $self->{processor}{$context}($text);
}


sub _dump {
    # return a prettified raw dump
    use Data::Dumper;
    local $Data::Dumper::Indent = 1;
    local $Data::Dumper::Terse  = 1;
    my $out = Dumper(@_);
    for ($out) {
        s/\[\n\s*'/[ '/g;
        s/\[ '(\w+)',/[ $1 =>/g;
        s/=>\n\s*('.*?')\n\s*\]/=> $1 ]/gs;
        s/\]\n\s*(?=\])/]/g;
    }
    return $out;
}


# check integrity of data structure
sub parse_rule_check {
    my ($self) = arg::test(@_, [ qw(object) ]) or return ();
    # * FIXME warn for used contexts (i.e. root contexts not occuring in
    #   subcontexts, except for the context named "root")
    # for each parser context
    return $self if exists($self->{parser_checked}); # only check once
    foreach my $context (keys %{$self->{parser}}) {
        # defaults
        $self->{parser}{$context}[1] ||= [];
        $self->{parser}{$context}[2] ||= sub { first(pop()) };
        # 1st: context-matching regex
        die "1st element not a regex in context '$context' \n"
            if ref($self->{parser}{$context}[0]) ne "Regexp";
        # 2nd: sub-context list
        die "2nd elementis not a list reference in context '$context' \n"
            if ref($self->{parser}{$context}[1]) ne "ARRAY";
        # 3rd: preprocessor code reference
        die "3rd elementis not a code reference in context '$context' \n"
            if ref($self->{parser}{$context}[2]) ne "CODE";
    }
    $self->{parser_checked} = 1;
    return $self;
}

# Usage: $TREE = $OBJ->parse([ $CONTEXT, $TEXT ], { OPTIONS })
# Usage: $TREE = $OBJ->parse([ $TEXT ], { OPTIONS })
# Usage: $TREE = $OBJ->parse([ $CONTEXT, $TEXT ])
# Usage: $TREE = $OBJ->parse([ $TEXT ])
#
# External interface for $OBJ->_parse(). Does error check of parser rules, and
# passes control to the actual parser.
sub parse {
    my ($self, $arg, $opt) = arg::test(@_, [ qw(object listref) ], [ qw(hashref) ])
      or return ();
    $self->parse_rule_check();

    unshift(@$arg, "root") if @$arg == 1;
    my ($context, $text) = @$arg;

    return $self->_parse({ indent => "" }, $text, $context);
}

# Usage: @TREE = $OBJ->_parse({ $OPTION => $VALUE... }, $TEXT, $CONTEXT);
#
# Return @TREE, a list-of-lists containing the parsed representation of $TEXT.
# Parsing of text starts with the context rules defined for $CONTEXT.
#
# Options may be passed anywhere in a hash reference.
sub _parse {
    my ($self, $opt, $text, $context) =
      arg::test(@_, [ qw(object hashref string_or_listref string) ]) or return ();
    return [ $context, @$text ] if ref($text) eq "ARRAY";     # $text already parsed
    die "no parser for context '$context', containing >$text<\n"
      unless exists($self->{parser}{$context});
    #print "$opt->{indent}context:$context\n";
    #print indent($text, "$opt->{indent}got:>>"), "<<\n" unless $context eq "root"
;

    my ($re, $contexts, $sub) = @{$self->{parser}{$context}};
    if (not @$contexts) {                      # no defined subcontexts
        #print "$opt->{indent}base case\n";
        return [ $context, $text ];
    }
    my $pos = 0;
    my @out = ();
  TEXT_BLOCK: while ($pos < length($text)) {
        foreach my $subcontext (@$contexts) {
            #print "$opt->{indent}subcontext:$subcontext\n";
            my ($re, $contexts, $sub) = @{$self->{parser}{$subcontext}};
            while (my ($pos2, @substr) = match($text, $re, $pos)) {
                #print "$opt->{indent}> $subcontext (match at $pos-$pos2)\n";
                push @out, $self->_parse({
                    indent  => $opt->{indent} . "    ",
                    context => $subcontext,
                    number  => scalar(@out),
                }, $self->$sub(\@substr), $subcontext);
                $pos = $pos2;
                next TEXT_BLOCK;
            }
        }
    }
    return [ $context, @out ];
}



# FIXME:
#   * transform_rule_check()
#   * transform()
#     o should allow optional hashref arg with rules, and if no such given, use
#       the one specified in new()
#   * _transform()

# Usage: @NEWTREE = transform({ $BRANCHNAME => $CODEREF...}, @TREE);
#
# Recursivelly walks through all given @TREEs, and for each subtree named
# $BRANCHNAME, calls $CODEREF with ($BRANCHNAME, @BRANCHCONTENT) as arguments.
#
# When $BRANCHNAME is found, does not recurse down into it (you can do this
# explicitly in your rules, if you want, however, see examples below).
#
# Example:
#
#     $RULES = {
#         a => sub { do_something(@_) },
#     };
#     $TREE = transform($RULES, [ a => [ a => 1 ], [ b => 2 ]]);
#
# This would traverse the tree (a->(a->1)(b->2)), and, upon finding the first
# occurance of "a" (in the root context), call $CODEREF with the contents of
# the context "a". $CODEREF then will call &do_something([ a => 1 ], [b => 2 ])
# and whatever is returned by this call will then take the place of the
# branches (a->1) and (b->2) in $TREE.

# Also note that no further traversal is done into the arguments passed to
# do_something(), or its return value. If you want this you have to do it
# explicitly by changing the sub { } content to something link this:
#
#     sub {
#         do_something(transform($RULES, @_));
#     }
#
# or
#
#     sub {
#         transform($RULES, do_something(@_));
#     }
#
sub transform {
    my ($self, @tree) = @_;
    die "Transform called in scalar context" unless wantarray;
    my $rules = $self->{transformer};
    return map {
        if (is_string($_)) {
            $_;
        } elsif (exists $rules->{ first($_) }) {
            &{ $rules->{first($_)} }($self, list($_));
        } else {
            [ first($_), $self->transform(tail($_)) ];
        }
    } @tree;
}

sub compose_rule_check {
    my ($self) = arg::test(@_, [ qw(object) ]) or return ();

}

# Usage: $OBJ->compose();
# Usage: $OBJ->compose( { PROCESSORS } );
#
# Outputs text previously parsed, using the specified PROCESSORS. One processor
# must be defined for each context in the parser, or, optionally, a default
# empty ("") processor may be specified to handle every case for which no other
# processor is specified.
#
# PROCESSORS are is a hash reference, where keys are equal to the name of the
# context, and values are references to subs doing some kind of transformation.
# The empty key ("") will be invoked if no matching context could be found. 1st
# argument is the content of the context, 2nd argument is the name of the
# context.
#
#     {
#         plain => sub { shift() },  # simplest case scenario
#         ""    => sub {
#             my ($text, $context) = @_;
#             return "<$context>$text</$context>";
#         },
#     }
#
sub compose {
    my ($self, $treeref, $ruleref) =
        arg::test(@_, [ qw(object listref) ], [ qw(hashref) ]) or return ();
    $ruleref = $self->{composer} unless defined($ruleref);# default (given in new())
    return _dump($treeref) unless %{$ruleref};  # "raw" dump of parsed tree
    # ERROR CHECKS default rule OR all contexts defined should be defined
    my @missing = grep { !exists($ruleref->{$_}) } $self->context();
    if (@missing) {
        arg::mywarn("missing compose rule for context(s): '" . join("', '", @missing) . "'", 0);
        return ();
    }
    return _compose($ruleref, {}, $treeref);
}

# Usage: _compose( { RULES }, { ENV }, @TAGS );
#
# NOTE: Shouldn't be called object-orientedly!
sub _compose {
    my ($ruleref, $envref, @tagref) = @_;
    my $out = "";
    foreach my $tag (@tagref) {
        if (ref($tag) eq "") {   # not array reference,
            $out .= defined($tag) ? $tag : "";  #   just insert contents
            next;
        }
        my ($context, @content) = @$tag;
        if (exists($ruleref->{$context})) {
            $out .= &{$ruleref->{$context}}(_compose($ruleref, {}, @content));
        } else {
            # FIXME
            warn "Missing compose rule for context '$context'\n";
            $out .= &{$ruleref->{""}}(_compose($ruleref, {}, @content), $context);
        }
    }
    return $out;
}

# Usage: @CONTEXT = $OBJ->context();
#
# Returns list of all contexts defined in $OBJ.
sub context {
    my ($self) = arg::test(@_, [ qw(object) ]) or return ();
    my %context = ();
    foreach my $context (keys %{$self->{context}}) {
        $context{$context} = 1;
        foreach (@{$self->{context}{$context}}) {
            $context{$_} = 1;
        }
    }
    return keys %context;
}

sub plot_contexts {
    my ($self) = arg::test(@_, [ qw(object) ]) or return ();
    return
      "#!/usr/bin/dot -Tpng\n" .
      "# Graphviz source generated by '" . __PACKAGE__ . "' perl module, " .
      localtime() . ".\n" .
      "\n" .
      "digraph finite_state_machine {\n" .
      "node [shape = circle];\n" .
      join("",
          map {
              my $context = $_;
              map {
                  "    $context -> $_;\n";
              } @{$self->{context}{$context}};
          } sort keys %{$self->{context}}
      ) .
      "}\n";
}

1;

#[eof]
