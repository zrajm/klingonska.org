\version "2.8.0"


%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
%%                                                                           %%
%%  Settings                                                                 %%
%%                                                                           %%
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%


\header {
    title = \markup \bold { taHjaj wo’. }
    subtitle = \markup \italic { An Imperial Anthem. }
    composer = \markup {
        Rich \bold { “HoD Qanqor” } Yampell, %(birth–death)
        %\italic { First Booke of Songes or Ayres, }
        1993
    }
    tagline = \markup \column { \center-align {
        \line { Zrajm C Akfohg, May 2006 }
        \line { http://zrajm.klingonska.org/songs/ }
    }}
}


myStaffSize = #18
#(set-global-staff-size myStaffSize)
\paper {
    #(set-paper-size "a4" 'landscape)  % A4 = 210mm × 297.9mm
    ragged-bottom   = ##t
    %ragged-last     = ##t
    print-page-number = ##f  % turn on/off page number printing

%    top-margin     = 12.5\mm                 %default: 5\mm
    %top-margin     = 10\mm                    %default: 5\mm
    %bottom-margin  = 10\mm                    %default: 6\mm
    %left-margin   = #f      % (Que?)
    %head-separation       = 0\mm  %% no effect?   %default: 4\mm
    page-top-space        = 0\mm
    %foot-separation       = 0\mm
    %%%foot-separation      = 4\mm                  %default: 4\mm

    %before-title-space = 50\mm
        % only useful if there's a title coming after some staves
    %between-title-space = 10\mm  % dist between titles
        %(e.g., the title of the book and the title of a piece)
%    after-title-space = 0\mm
        % distance between title/composer header and fist system thereafter
        % If set to '0\mm', generates the somewhat bizarre error message:
        %    programming error: insane spring found, setting to unit
        %    continuing, cross fingers

    %indent = 10\mm
        % indent for 1st system (excluding any leftmost labels)
    %between-system-space  = 0.1\mm
    %between-system-padding = 0.1\mm
        % between systems, and topmost system/title (overlapping with
        % `after-title-space', I think)

%    #(define fonts
%        (make-pango-font-tree
%         "Vera Serif" "Times New Roman" "Courier"
%         (/ myStaffSize 20)))

%    annotate-spacing = ##t
        % DEBUG: show various distances on page
}
\layout {
    papersize = "a4"
%    \context {
%        \GrandStaff
%            \consists Instrument_name_engraver
%                % FIXME: turn off ambitus_engraver for the lute part (GrandStaff)!
%    }
    \context {
        \Voice
            \remove "Dynamic_engraver"
    }
%    \context {
%        \Staff
%            %\consists Ambitus_engraver
%            \override VerticalAxisGroup #'minimum-Y-extent = #'(-4.8 . 4) %default: #'(-4 . 4)
%                % same as \override VerticalAxisGroup #'minimum-Y-extent for lyrics below, but for staff
%    }
%    \context {
%        \Lyrics
%            fontSize = #-1
%            \override VerticalAxisGroup #'minimum-Y-extent = #'(-.8 . 1.6) %default: '(-1.2 . 2.4)
%                % space lyrics closely (later add some extra space between verses)
%                % 1st (negative) value is distance below, 2nd (positive) is dist above
%
%            \override LyricExtender #'minimum-length = #0  %default: #1.5
%                % allow extender lines (used in lyrics for melisma) to become
%                % zero in length
%
%            \override LyricHyphen   #'minimum-length = #0 %default: #0.3
%            %\override LyricHyphen   #'padding        = #15 %default: #0.07
%            %\override LyricHyphen   #'thickness      = #9  %default: #1.3
%                % FIXME: allow hyphens to become zero in length (NOTE:
%                % hyphenated syllables are still padded from each other, so
%                % just setting minimum hyphen length to zero have no effect)
%
%            \override LyricText #'word-space = #50 %default: #0.6
%                % FIXME: how do you set minimum width of space in lyrics?
%    }
}
\midi {
    \tempo 4 = 100
}



%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
%%                                                                           %%
%%  Functions                                                                %%
%%                                                                           %%
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%


% for left-aligning a syllable of lyrics
% (appropriate at beginning of each line and page)
left = {
    \once \override LyricText #'self-alignment-X = #-1 %default: #0
}



%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
%%                                                                           %%
%%  Lyrics                                                                   %%
%%                                                                           %%
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%


% Swedish lyrics
lyricTlhI = \lyricmode {
    %% 1:1
    taH -- jaj wo’
    %% 1:2
    ’ej taH -- jaj voD -- leH -- ma’
    %% 1:3
    wI -- toy’ -- mo’
    %% 1:4
    vaj nu -- quv -- moH -- jaj ta’
    %% 1:5
    Dun wo’ -- maj
    %% 1:6
    ’ej Qoch -- chugh vay’
    %% 1:7
    vaj DaS -- mey -- maj bIng -- Daq chaH
    %% 1:8
    DI -- beQ -- moH -- chu’ jay’!
}
lyricTlhII = \lyricmode {
    %% 2:1
    taH -- jaj taH -- jaj wo’ ’ej taH -- jaj maH!
    %% 2:2
    bech -- jaj jagh -- ma’; Hegh -- jaj chaH!
    %% 2:3
    wI -- toy’ wI -- toy’ -- bej net Sov net Sov!
    %% 2:4
    val ’ej may voD -- leH -- ma’ pov!
    %% 2:5
    Dun wo’ Dun wo’ -- vam, juH -- maj; not Dej
    %% 2:6
    Qoch -- chugh Qoch -- chugh vay’ vaj Dogh -- qu’ -- bej!
    %% 2:7
    DaS -- mey -- maj bIng -- Daq chaH DI -- beQ --
    %% 2:8
    moH -- chu’ jay’!
}
lyricTlhIII = \lyricmode {
    %% 3:1
    ma -- Sop -- nIS -- be’,
        ma -- tlhutlh -- nIS -- be’,
        ’ej ma -- Do’ -- chugh,
        ma -- tlhuH -- nIS -- be’
    %% 3:2
    Doch neH wI -- ta’ --
        nIS -- bogh ’oH tlhI --
        ngan wo’ -- ’a’ HoS --
        ghaj toy’ -- ghach -- ’e’
    %% 3:3
    may’ -- ’a’ -- mey -- Daq,
        veS -- ’a’ -- mey -- Daq,
        ’ej reH ’ej reH
        yay -- ’a’ -- mey -- Daq
    %% 3:4
    Qap -- la’ wI -- chav
        ’ej batlh wI -- Suq
        ’ej tlhI -- ngan wo’
        nIv -- ghach wI -- maq
    %% 3:5
    ma -- toy’ -- rup -- chu’,
        ma -- Suv -- laH -- chu’,
        ma -- Hegh -- qang -- chu’
        ’ut -- chugh ’ut -- mo’
    %% 3:6
    ’ach Hegh -- may yI --
        pIH -- Qo’ ghay -- tan
        wa’ -- DIch jagh -- ’e’
        wI -- Hegh -- moH -- mo’
    %% 3:7
    vaj taH -- jaj wo’,
        vaj taH -- jaj wo’,
        ’u’ HeH -- Daq tlhI --
        ngan juH -- qo’ -- vo’
    %% 3:8
    vaj taH -- jaj taH --
        jaj taH -- jaj taH --
        jaj taH -- jaj tlhI --
        ngan wo’
}



%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
%%                                                                           %%
%%  Choir Notes                                                              %%
%%                                                                           %%
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%


soprano = \new Staff {
    \new Voice {
        \set Staff.autoBeaming    = ##f
        \set Staff.midiInstrument = "drawbar organ"
        %\set Staff.instrument     = \markup { I " " }
        %\set Staff.instr          = \markup { I " " }

        \clef treble
        \time 2/2

        \transpose c c' {
            \partial 4*1 r4\pp |
            a2 b            | % A2 B2         taHjaj
            c'2. e4         | % C3 E2         wo’ ’ej..
            a c' b a        | % A2 C3 B2 A2   taHjaj voDleH-
            gis2. r4        | % G#2 -         ma’ _

            b2 c'           | % B2 C3         wI’toy’-
            d'2. e4         | % D3 E2         mo’ vaj..
            b d' c' b       | % B2 D3 C3 B2   nuquvmoHjaj
            a2. r4          | % A2 -          ta’

            a2 b            | % A2 B2         Dun wo’-
            c'2. a4         | % C3 A2         maj ’ej..
            c'2 d'          | % C3 D3         Qochchugh
            dis'2. c'4      | % D#3 C3        vay’ vaj..

            dis' dis' d' d' | % D#3 D#3 D3 D3  DaSmeymaj bIng-
            c' c' b b       | % C3 C3 B2 B2    Daq chaH DIbeQ-
            a2 gis          | % A2 G#2         moHchu’
            a2.               % A2             jay’
          \bar "|."
        } % transpose
    } % Voice
    \addlyrics { \lyricTlhI }
} % soprano


alto = \new Staff {
    \new Voice {
        \set Staff.autoBeaming    = ##f
        \set Staff.midiInstrument = "drawbar organ"
        %\set Staff.instrument     = \markup { II  " " }
        %\set Staff.instr          = \markup { II  " " }

        \clef treble
        \time 2/2
        \autoBeamOn

        \set Staff.midiInstrument = "breath noise"
        %\set Score.skipBars = ##t
        \transpose c c' {
            \partial 4*1 r4\ppp  |
            %\partial 4*1 r4\ffff   | %
            r b r b                | % _ taH- _ jaj
            b8 b b b b b b4        | % taHjaj wo’ ’ej taHjaj maH!
            R2*2                   | %
            b8 b b b b b b4        | % bechjaj jaghma’; Heghjaj chaH!

            r b r b                | % _ wI- _ toy’
            b8 b b b b b b4        | % wItoy’bej net Sov net Sov!
            R2*2                   | %
            b8 b b b b b b4        | % val ’ej may voDleHma’ pov!

            r b r b                | % _ Dun _ wo’
            b8 b b b b b b4        | % Dun wo’vam, juHmaj; not Dej
            r b r b                | % _ Qoch- _ chugh
            b8 b b b b b b4        | % Qochchugh vay’ vaj Doghqu’bej!

            b b b b                | % DaSmeymaj bIng-
            b b b b                | % Daq chaH DIbeQ-
            r b r b                | % _ moH- _ chu’
            b2.                      % jay’!
          \bar "|."
        } % transpose
    } % Voice
    \addlyrics { \lyricTlhII }
} % alto


tenor = \new Staff {
    \new Voice {
        \set Staff.autoBeaming    = ##f
        \set Staff.midiInstrument = "woodblock"
        %\set Staff.instrument     = \markup { III " " }
        %\set Staff.instr          = \markup { III " " }

        \clef treble
        \time 2/2
        \autoBeamOn

        \transpose c c' {
            \partial 4*1 b4\p       | % ma-
            b8\sf b\p  b\ff  b\p      % SopnISbe’, ma-
            b\sf  b\p  b\ff  b\p    | % tlhutlhnISbe’, ’ej
            b\sf  b\p  b\ff  b\p      % maDo’chugh, ma-
            b\sf  b\p  b\ff           % tlhuHnISbe’
          %\bar ""
            b\p                     | % Doch
            b\sf  b\p  b\ff  b\p      % neH wIta’nIS-
            b\sf  b\p  b\ff  b\p    | % bogh ’oH tlhIngan
            b\sf  b\p  b\ff  b\p      % wo’’a’ HoSghaj
            b\sf  b\p  b\ff           % toy’ghach’e’
          %\bar ""
            b\p                     | % may’-
            b\sf  b\p  b\ff  b\p      % ’a’meyDaq, veS-
            b\sf  b\p  b\ff  b\p    | % ’a’meyDaq, ’ej
            b\sf  b\p  b\ff  b\p      % reH ’ej reH yay-
            b\sf  b\p  b\ff           % ’a’meyDaq
          %\bar ""
            b\p                     | % Qap-
            b\sf  b\p  b\ff  b\p      % la’ wIchav ’ej
            b\sf  b\p  b\ff  b\p    | % batlh wISuq ’ej
            b\sf  b\p  b\ff  b\p      % tlhIngan wo’ nIv-
            b\sf  b\p  b\ff           % ghach wI-maq
          %\bar ""
            b\p                     | % ma-
            b\sf  b\p  b\ff  b\p      % toy’rupchu’, ma-
            b\sf  b\p  b\ff  b\p    | % SuvlaHchu’, ma-
            b\sf  b\p  b\ff  b\p      % Heghqangchu’ ’ut-
            b\sf  b\p  b\ff           % chugh ’utmo’
          %\bar ""
            b\p                     | % ’ach
            b\sf  b\p  b\ff  b\p      % Heghmay yIpIH-
            b\sf  b\p  b\ff  b\p    | % Qo’ ghaytan wa’-
            b\sf  b\p  b\ff  b\p      % DIch jagh’e’ wI-
            b\sf  b\p  b\ff           % HeghmoHmo’
          %\bar ""
            b\p                     | % vaj
            b\sf  b\p  b\ff  b\p      % taHjaj wo’, vaj
            b\sf  b\p  b\ff  b\p    | % taHjaj wo’, ’u’
            b\sf  b\p  b\ff  b\p      % HeHDaq tlhIngan
            b\sf  b\p  b\ff           % juHqo’vo’
          %\bar ""
            b\p                     | % vaj
            b\sf  b\p  b\ff  b\p      % taHjaj taHjaj
            b\sf  b\p  b\ff  b\p    | % taHjaj taHjaj
            b\sf  b\p  b\ff  b\p      % taHjaj tlhIngan
            b4\sf                     % wo’
          \bar "|."
        } % transpose
    } % Voice
    \addlyrics { \lyricTlhIII }
} % tenor


choir = {
    \new ChoirStaff <<
        \soprano
        \alto
        \tenor
    >>
}



%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
%%                                                                           %%
%%  Score                                                                    %%
%%                                                                           %%
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%


\book {
    \score {                                \choir                   } % notes
    \score { \applyMusic #unfold-repeats    \choir          \midi {} } % all
    \score { \applyMusic #unfold-repeats    \soprano        \midi {} } % S
    \score { \applyMusic #unfold-repeats    \alto           \midi {} } % A
    \score { \applyMusic #unfold-repeats    \tenor          \midi {} } % T
}

%[[eof]]
