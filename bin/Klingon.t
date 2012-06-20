#!/usr/bin/perl -w
use 5.10.0;
use strict;
use warnings;
use utf8;
use open ':locale';

use Test::More;# tests => 4;

use Klingon qw/split_letter/;

note("alphabet setting/adding/deleting");
{
    my @org_alpha = Klingon::get_alpha();
    Klingon::add_alpha(" ");
    is_deeply([ Klingon::get_alpha() ], [ @org_alpha, " " ], "added ' ' to alphabet");
    Klingon::del_alpha(" ");
    is_deeply([ Klingon::get_alpha() ], \@org_alpha, "removed ' ' from alphabet");
    Klingon::set_alpha();
    is_deeply([ Klingon::get_alpha() ], [], "zeroed alphabet");
    Klingon::set_alpha(@org_alpha);
    is_deeply([ Klingon::get_alpha() ], \@org_alpha, "re-set alphabet to original");
}


note("in list context");
is_deeply([ split_letter("") ],         [], "split_letter('') = qw()");
is_deeply([ split_letter("X") ],        [], "split_letter('X') = qw()");
is_deeply([ split_letter("nenghep") ],  [ qw/n e n gh e p/ ], "split_letter('nenghep') = qw(n e n gh e p)");
is_deeply([ split_letter("nenHep") ],   [ qw/n e n H e p/  ], "split_letter('nenHep') = qw(n e n H e p)");
is_deeply([ split_letter("nengHep") ],  [ qw/n e ng H e p/ ], "split_letter('nengHep') = qw(n e ng H e p)");
is_deeply([ split_letter("tlhutlh") ],  [ qw/tlh u tlh/    ], "split_letter('tlhutlh') = qw(tlh u tlh)");
is_deeply([ split_letter("tlhutlhX") ], [], "split_letter('tlhutlhX') = qw()");

note("in scalar context");
is_deeply([ scalar(split_letter("")) ],         [ undef ], "split_letter('') = undef");
is_deeply([ scalar(split_letter("X")) ],        [ undef ], "split_letter('X') = undef");
is_deeply([ scalar(split_letter("nenghep")) ],  [ "n" ], "split_letter('nenghep') = 'n'");
is_deeply([ scalar(split_letter("nenHep")) ],   [ "n" ], "split_letter('nenHep') = 'n'");
is_deeply([ scalar(split_letter("nengHep")) ],  [ "n" ], "split_letter('nengHep') = 'n'");
is_deeply([ scalar(split_letter("tlhutlh")) ],  [ "tlh" ], "split_letter('tlhutlh') = 'tlh'");
is_deeply([ scalar(split_letter("tlhutlhX")) ], [ undef ], "split_letter('tlhutlhX') = undef");


done_testing();

