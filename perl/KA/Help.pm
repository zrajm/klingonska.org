package KA::Help;
use strict;
use warnings;
use 5.10.0;

use Exporter;
use vars qw($VERSION @ISA @EXPORT_OK);

$VERSION     = 1.00;
@ISA         = qw(Exporter);
@EXPORT_OK   = qw(usage manpage);

my $includer = do {                            # name of including program
    use Cwd "realpath";
    my $file = (caller())[1];
    realpath($file);
};

###############################################################################
##                                                                           ##
##  Functions                                                                ##
##                                                                           ##
###############################################################################

sub read_file {
    my ($file) = @_;
    open(my $in, "<:utf8", $file)
        or die "Failed to open file '$file' for reading\n";
    return join("", <$in>);
}

# Convert POD into ANSI escape sequences for the terminal. Does not do
# recursion. (But since E<...> is handled first, those are allowed inside both
# B<...> and I<...>, and since C<...> is treated last, all other POD sequences
# are allowed inside those.)
sub pod2ansi {
    my ($_) = @_;
    return undef unless defined($_);
    my %char = (quot => '"', amp => '&', lt => '<', gt => '>');
    s#E<([^>]*)>#$char{lc $1}#g;     # HTML-like entity
    s#B<([^>]*)>#\e[1m$1\e[0m#g;     # bold
    s#[FI]<([^>]*)>#\e[4m$1\e[0m#g;  # italic / filename
    s#C<([^>]*)>#"$1"#g;             # quoted code
    return $_;
}

sub version {
    my ($name, $version, $year) = ($main::NAME, $main::VERSION, $main::YEAR);
    if (defined($name) and defined($version) and defined($year)) {
        print "$name (klingonska.org) $version\n",
            "Copyright (C) $year zrajm <zrajm\@klingonska.org>\n",
            "License CC BY-SA 3.0: Creative Commons Attribution-",
            "ShareAlike 3.0 Unported\n",
            "    <http://creativecommons.org/licenses/by-sa/3.0/>\n";
        exit 0;
    }
    die __PACKAGE__ . "::version(): \$NAME, \$VERSION and \$YEAR is not "
        . "defined in '$0'\n";
}

sub usage {
    my ($msg) = @_;
    my $_ = read_file($includer);
    my $out;
    $out .= m#^=head1 \s+ SYNOPSIS \s+ (.*)#mx
        ? "Usage: " . pod2ansi($1) . "\n" : "";
    $out .= m#^=head1 \s+ NAME \s+ [-\w]+ \s+-\s+ (.*)#mx ? "\u$1.\n" : "";
    $out .= "\n" if $out;
    { # list --options (from comments) -- sort by longopt name
        my @opt_doc = ();
        my $opt_length = 0;
        while (/^ \s*
                (?: (['"])                     # start quote
                    ([^\n'"=:|]*?)             #   long opt
                    (?:\|([^\n'"=:]*?))?       #   short opt
                    (?:\+|([:=])[^\n'"=]*)?    #   opt arg
                    \1 [^#]*                   # end quote
                |.*?)?(?<!\#)\#\#\#\s+(.*)$/xmg) { # description
            my $long  = $2 ? "--$2"  : "";
            my $short = $3 ?  "-$3," : "";
            my $arg   = $4;
            my $desc  = $5;
            # if option takes arg, and 1st word in description is uppercase,
            # use that uppercase word in long description description
            if ($arg and $desc =~ s/([A-Z0-9]+)\s*//) {
                $long .= $arg eq ":" ? "[=$1]" : "=$1";
            }
            push(@opt_doc, [ $short, $long, pod2ansi($desc) ]);
            my $length = length($long);
            $opt_length = $length if $length > $opt_length;
        }
        # length of longest option name
        if (@opt_doc) {
            $out .= join "", "Options:\n", map {
                sprintf "  %-3s %-${opt_length}s  %s\n", @$_
            } @opt_doc;
        }
    }
    print "$out\n$msg";
    exit;
}

sub manpage {
    my $pid = open(STDOUT, "|-", qw/man -l -/);# STDOUT to 'man'
    die "Failed no run 'man': $!\n" unless defined $pid;
    system("pod2man", "$includer");            # produce manpage from POD
    close STDOUT;                              # don't make 'man' wait for more
    wait();                                    # wait until user exits 'man'
    exit;
}

1;

#[eof]
