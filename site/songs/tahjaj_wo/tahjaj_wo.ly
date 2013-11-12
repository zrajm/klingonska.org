\version "2.14.0"

%% HISTORY
%% =======
%% May 12--26, 2013: Friend and musician Leon Zendejas Medina proofread and
%% gave suggestions on the score. Based on this I shortened the upbeat from a
%% crotchet to a quaver and added rhythm marks (rythm mark source was taken
%% from Lilypond Snippet Repository, http://lsr.dsi.unimi.it/LSR/Item?id=204).
%% Also added more punctuation to the lyrics to improve readability. Somewhere
%% along the way the source got upgraded to Lilypond 2.14 as well.
%%
%% December 27, 2012: Ryan Hart sent me a score which included the melodies of
%% voices 2 & 3, so I brushed off the old Lilypond 2.8 score, upgraded it to
%% 2.12.3 (the version of Lilypond that comes with Ubuntu Lucid Lynx).
%% November 28, 2006: Converted source from Lilypond 2.6 to 2.8 format.
%%
%% May 17, 2006: Copied rhythm patterns and syncronized the three voices with
%% respect to each other. Also tested a program called `midingsolo', and used
%% it to transcribe the melody of the first voice from the melody I've got in
%% my head. (I think I have it on cassette somewhere, but I don't have a
%% cassette player..) Many thanks to Jennifer Saverstam-Lydecker for
%% inspiration.

%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
%%                                                                           %%
%%  Settings                                                                 %%
%%                                                                           %%
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

\header {
    title = \markup \medium {
        \bold { taHjaj wo’ } \hspace #1 – \hspace #1
        \italic { An Imperial Anthem }
    }
    composer = \markup {
        Rich \bold { “HoD Qanqor” } Yampell, %(birth–death)
        %\italic { First Booke of Songes or Ayres, }
        1993
    }
    tagline = \markup \center-column {
        \line { Score typeset by zrajm, May 2006–May 2013 }
        \line { Chords and 2nd & 3rd voices provided by Ryan Hart, December 2012 }
        \line { Proofreading & suggestions by Leon Zendejas Medina, May 2013 }
        \line {
          \with-url #"http://klingonska.org/songs/tahjaj_wo/" {
            \typewriter http://klingonska.org/songs/tahjaj_wo/
          }
        }
    }
}

#(set-global-staff-size 18)
#(set-default-paper-size "a4" 'landscape)
\paper {
    % DEBUG: show various distances on page
    %annotate-spacing = ##t

    check-consistency = ##t
    ragged-bottom   = ##t
    %ragged-last     = ##t
    print-page-number = ##f  % turn on/off page number printing

    % page margins
    bottom-margin = 10\mm
    left-margin   = 10\mm
    right-margin  = 10\mm
    top-margin    = 14\mm

    % indent for 1st system (not including any leftmost labels)
    %
    % May 26, 2013: Removed indentation of 1st system on advice: "9. Align
    % objects neatly. Indenting the top system margin [...] unnecessarily adds
    % to the complexity of the page; it introduces an angle by having that
    % system uneven with the others."
    % [http://jonathanfeist.berkleemusicblogs.com/2009/05/10/
    % ten-tips-towards-clearer-notation/]
    indent = 0\mm

    % space between page title and 1st system
    markup-system-spacing #'basic-distance = #20

    % space between top margin + 1st system
    top-system-spacing #'basic-distance = #5

    % space between systems
    system-system-spacing #'basic-distance = #21
}
\layout {
    % The below stuff should work, but doesn't for some reason. Probably a
    % Lilypond bug -- below 'withoutDynamics' function is used instead. (The
    % dynamic marks of voice III is used for MIDI output, and should not be
    % displayed in score.)
    %\context { \Voice
    %    \remove Dynamic_engraver
    %}
    \context { \Staff
        %\consists Ambitus_engraver
        % spacing between staffs within a system
        \override VerticalAxisGroup #'staff-staff-spacing =
            #'((padding . 1)
              (basic-distance . 6)
              (minimum-distance . 5)
              (stretchability . 0))

        % right-align the voice names
        \override InstrumentName #'padding = #0.75
        \override InstrumentName #'self-alignment-X = #RIGHT
    }
    \context { \Lyrics
        % spacing between lyrics and its staff
        \override VerticalAxisGroup #'staff-affinity = #UP
        \override VerticalAxisGroup #'nonstaff-relatedstaff-spacing =
            #'((padding . 1)
              (basic-distance . 6)
              (minimum-distance . 6)
              (stretchability . 0))
    }
}
\midi {
    \context { \Score
        tempoWholesPerMinute = #(ly:make-moment 100 4)
    }
}

%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
%%                                                                           %%
%%  Functions                                                                %%
%%                                                                           %%
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

withoutDynamics = #(define-music-function (parser location music) (ly:music?)
    (music-filter
        (lambda (evt)
            (not (memq (ly:music-property evt 'name) (list
                'AbsoluteDynamicEvent
                'CrescendoEvent
                'DecrescendoEvent))))
    music))

%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
%%                                                                           %%
%%  Lilypond Snippet Repository Functions                                    %%
%%                                                                           %%
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

%%% Below function is a stripped down function from the Lilypond Snippet
%%% Repository (http://lsr.dsi.unimi.it/LSR/Item?id=204, or search for "swing
%%% rhythm") /zrajm [2013-05-17]

%%% Function: rhythmMark
%%% ============================================================
%%%  Purpose: print a sophisticated rehearsal mark e.g for
%%%           rhythm directives
%%%    Usage: \rhythmMark music1 music2
%%% ------------------------------------------------------------
%%% Variable: music1 (ly:music)
%%% ------------------------------------------------------------
%%% Variable: music2 (ly:music)
%%% ------------------------------------------------------------
%%%  Example: \rhythmMark #"Swing" \rhyMarkIIEighths
%%%                 \rhyMarkSlurredTriplets
%%% ------------------------------------------------------------
%%% Constants:
%%%           rhythmMarkStaffReduce = #-3
%%% ============================================================

rhythmMarkStaffReduce = #-3

rhythmMark = #(define-music-function (parser location musicI musicII) (ly:music? ly:music?)
    #{
       \mark \markup {
           \score {
               \new Staff \with {
                   fontSize = #rhythmMarkStaffReduce
                   \override StaffSymbol #'staff-space = #(magstep rhythmMarkStaffReduce)
                   \override StaffSymbol #'line-count = #0
                   \override VerticalAxisGroup #'Y-extent = #'(-0.85 . 4)
               }
               {
                   \relative { \stemUp $musicI }

                   \once \override Score.TextScript #'Y-offset = #-0.4
                   s4.^\markup{ \halign #-1 \italic "=" }

                   \relative { \stemUp $musicII }
               }
               \layout {
                   ragged-right= ##t
                   indent = 0
                   \context {
                       \Staff
                       \remove "Clef_engraver"
                       \remove "Time_signature_engraver"
                   }
               } % layout end
           } % score end
       } % markup end
    #})

%%% predefined ly:music-Variables for use in function rhythmMark
rhyMarkIIEighths = {
  \override Score.SpacingSpanner #'common-shortest-duration = #(ly:make-moment 3 16) % even
  b'8[ b8]
}
rhyMarkTriplets = {
  \override Score.SpacingSpanner #'common-shortest-duration = #(ly:make-moment 3 16) % even
  \times 2/3 { b'4 b8 }
}


%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
%%                                                                           %%
%%  Lyrics                                                                   %%
%%                                                                           %%
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

lyricsI = \lyricmode {
    taH -- jaj wo’
    ’ej taH -- jaj voD -- leH -- ma’.
    wI -- toy’ -- mo’
    vaj nu -- quv -- moH -- jaj ta’.
    Dun wo’ -- maj
    ’ej Qoch -- chugh vay’
    vaj DaS -- mey -- maj bIng -- Daq chaH
    DI -- beQ -- moH -- chu’ jay’!
}

lyricsII = \lyricmode {
    taH -- jaj, taH -- jaj wo’ ’ej taH -- jaj maH!
    bech -- jaj jagh -- ma’; Hegh -- jaj chaH!
    wI -- toy’, wI -- toy’ -- bej net Sov, net Sov!
    val ’ej may voD -- leH -- ma’ pov!
    Dun wo’, Dun wo’ -- vam, juH -- maj; not Dej.
    Qoch -- chugh, Qoch -- chugh vay’ vaj Dogh -- qu’ -- bej!
    DaS -- mey -- maj bIng -- Daq chaH DI -- beQ --
    moH -- chu’ jay’!
}

lyricsIII = \lyricmode {
    ma -- Sop -- nIS -- be’,
        ma -- tlhutlh -- nIS -- be’,
        ’ej ma -- Do’ -- chugh,
        ma -- tlhuH -- nIS -- be’.
    Doch neH wI -- ta’ --
        nIS -- bogh ’oH tlhI --
        ngan wo’ -- ’a’ HoS --
        ghaj toy’ -- ghach -- ’e’.
    may’ -- ’a’ -- mey -- Daq,
        veS -- ’a’ -- mey -- Daq,
        ’ej reH, ’ej reH
        yay -- ’a’ -- mey -- Daq
    Qap -- la’ wI -- chav,
        ’ej batlh wI -- Suq,
        ’ej tlhI -- ngan wo’
        nIv -- ghach wI -- maq.
    ma -- toy’ -- rup -- chu’,
        ma -- Suv -- laH -- chu’,
        ma -- Hegh -- qang -- chu’,
        ’ut -- chugh ’ut -- mo’,
    ’ach Hegh -- maj yI --
        pIH -- Qo’, ghay -- tan
        wa’ -- DIch jagh -- ’e’
        wI -- Hegh -- moH -- mo’.
    vaj taH -- jaj wo’,
        vaj taH -- jaj wo’,
        ’u’ HeH -- Daq tlhI --
        ngan juH -- qo’ -- vo’,
    vaj taH -- jaj, taH --
        jaj, taH -- jaj, taH --
        jaj, taH -- jaj tlhI --
        ngan wo’.
}

%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
%%                                                                           %%
%%  Melodies                                                                 %%
%%                                                                           %%
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

accomp = \chordmode {
    \set ChordNames.midiInstrument = "acoustic grand"
    \partial 8 s8 |   % invisible rest for upbeat
    a2:m e:7 | a2.:m e4:7 | a1:m | e:7 |
    e2:7 a:m | e1*2:7     | a1:m |
    a2:m e:7 | a2.:m g4:7 | c2:m g:7 | c2.:m g4:7 |
    c2:m g:7 | c:dim  e:7 | a:m e:7  | a2..:m
}

voiceI = {
    \set Staff.midiInstrument = "drawbar organ"
    %\set Staff.instrumentName = \markup { I }
    \clef treble
    \time 2/2
    \transpose c c' {
        \once \override Score.RehearsalMark #'X-offset = #1.5
        \rhythmMark \rhyMarkIIEighths \rhyMarkTriplets
        \partial 8 r8   |
        a2 b            | % A2 B2         taHjaj
        c'2. e4         | % C3 E2         wo’ ’ej..
        a c' b a        | % A2 C3 B2 A2   taHjaj voDleH-
        gis2. r4        | % G#2 -         ma’ _
        \break
        b2 c'           | % B2 C3         wI’toy’-
        d'2. e4         | % D3 E2         mo’ vaj..
        b d' c' b       | % B2 D3 C3 B2   nuquvmoHjaj
        a2. r4          | % A2 -          ta’
        \break
        a2 b            | % A2 B2         Dun wo’-
        c'2. a4         | % C3 A2         maj ’ej..
        c'2 d'          | % C3 D3         Qochchugh
        es'2. c'4       | % D#3 C3        vay’ vaj..
        \break
        es' es' d' d'   | % D#3 D#3 D3 D3  DaSmeymaj bIng-
        c' c' b b       | % C3 C3 B2 B2    Daq chaH DIbeQ-
        a2 gis          | % A2 G#2         moHchu’
        a2..              % A2             jay’
        \bar "|."
    }
} % voiceI

voiceII = {
    \set Staff.midiInstrument = "acoustic grand"
    %\set Staff.instrumentName = \markup { II }
    \clef treble
    \time 2/2
    \transpose c c' {
        \partial 8 r8            |
        r4 e' r e'               | % _ taH- _ jaj
        c'8 b c' d' e' d' c'4    | % taHjaj wo’ ’ej taHjaj maH!
        R1                       | %
        b8 c' d' e' f' e' d'4    | % bechjaj jaghma’; Heghjaj chaH!

        r e' r e'                | % _ wI- _ toy’
        b8 c' d' e' f' e' d'4    | % wItoy’bej net Sov net Sov!
        R1                       | %
        c'8 d' e' f' e' d' c'4   | % val ’ej may voDleHma’ pov!

        r e' r e'                | % _ Dun _ wo’
        a8 b c' d' e' d' c'4     | % Dun wo’vam, juHmaj; not Dej
        r g' r g'                | % _ Qoch- _ chugh
        c'8 d' es' f' g' f' es'4 | % Qochchugh vay’ vaj Doghqu’bej!

        g' g' f' f'              | % DaSmeymaj bIng-
        es' es' e' e'            | % Daq chaH DIbeQ-
        r c' r b                 | % _ moH- _ chu’
        c'2..                      % jay’!
        \bar "|."
    }
} % voiceII

voiceIII = {
    \set Staff.midiInstrument = "acoustic grand"
    %\set Staff.instrumentName = \markup { III }
    \clef treble
    \time 2/2
    \transpose c c' {
        \partial 8             e8\p   | % ma-
        c'8\sf  b\p    a\ff    c'\p     % SopnISbe’, ma-
        d'\sf   c'\p   b\ff    d'\p   | % tlhutlhnISbe’, ’ej
        e'\sf   d'\p   c'\ff   b\p      % maDo’chugh, ma-
        c'\sf   b\p    a\ff             % tlhuHnISbe’
        %\bar ""
                               e\p    | % Doch
        a\sf    a\p    g\ff    g\p      % neH wIta’nIS-
        f\sf    f\p    e\ff    e\p    | % bogh ’oH tlhIngan
        f\sf    d\p    e\ff    gis\p    % wo’’a’ HoSghaj
        b\sf    gis\p  e\ff             % toy’ghach’e’
        %\bar ""
                               e\p    | % may’-
        d'\sf   c'\p   b\ff    d'\p     % ’a’meyDaq, veS-
        e'\sf   d'\p   c'\ff   e'\p   | % ’a’meyDaq, ’ej
        f'\sf   e'\p   d'\ff   c'\p     % reH ’ej reH yay-
        d'\sf   c'\p   b\ff             % ’a’meyDaq
        %\bar ""
                               a\p    | % Qap-
        gis\sf  gis\p  f\ff    f\p      % la’ wIchav ’ej
        e\sf    e\p    d\ff    d\p    | % batlh wISuq ’ej
        e\sf    d\p    e\ff    a\p      % tlhIngan wo’ nIv-
        c'\sf   a\p    e\ff             % ghach wI-maq
        %\bar ""
                               e\p    | % ma-
        c'\sf   b\p    a\ff    c'\p     % toy’rupchu’, ma-
        d'\sf   c'\p   b\ff    d'\p   | % SuvlaHchu’, ma-
        e'\sf   d'\p   c'\ff   d'\p     % Heghqangchu’ ’ut-
        e'\sf   d'\p   c'\ff            % chugh ’utmo’
        %\bar ""
                               d'\p   | % ’ach
        es'\sf  d'\p   c'\ff   es'\p    % Heghmaj yIpIH-
        f'\sf   es'\p  d'\ff   f'\p   | % Qo’ ghaytan wa’-
        g'\sf   f'\p   es'\ff  f'\p     % DIch jagh’e’ wI-
        g'\sf   f'\p   es'\ff           % HeghmoHmo’
        %\bar ""
                               es'\p  | % vaj
        g'\sf   g'\p   g'\ff   g'\p     % taHjaj wo’, vaj
        g'\sf   g'\p   g'\ff   g'\p   | % taHjaj wo’, ’u’
        ges'\sf ges'\p ges'\ff ges'\p   % HeHDaq tlhIngan
        gis'\sf gis'\p gis'\ff          % juHqo’vo’
        %\bar ""
                               e'\p   | % vaj
        e'\sf   e'\p   e'\ff   e'\p     % taHjaj taHjaj
        e'\sf   e'\p   e'\ff   e'\p   | % taHjaj taHjaj
        e'\sf   d'\p   c'\ff   b\p      % taHjaj tlhIngan
        a4.\sf                          % wo’
        \bar "|."
    }
} % voiceIII

choir = {
    \new ChoirStaff <<
        \new ChordNames \accomp

        \new Staff { \new Voice = "I" \voiceI }
        \new Lyrics { \lyricsto "I" \lyricsI }

        \new Staff  { \new Voice = "II" \voiceII }
        \new Lyrics { \lyricsto "II" \lyricsII }

        \new Staff { \new Voice = "III" \withoutDynamics \voiceIII }
        \new Lyrics { \lyricsto "III" \lyricsIII }
    >>
}

%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
%%                                                                           %%
%%  Score                                                                    %%
%%                                                                           %%
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

\book {
    \score {                             \choir             } % printed score
    \score { \applyMusic #unfold-repeats \choir    \midi {} } % all
    \score { \applyMusic #unfold-repeats \voiceI   \midi {} } % 1st voice
    \score { \applyMusic #unfold-repeats \voiceII  \midi {} } % 2nd voice
    \score { \applyMusic #unfold-repeats \voiceIII \midi {} } % 3rd voice
    %\score { \applyMusic #unfold-repeats \accomp   \midi {} } % accompaniment
}

%[[eof]]
