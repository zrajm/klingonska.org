# -*- makefile -*-
#
# NOTE: Server-Side Includes on HCOOP only works if the included page is *not*
# a script, but a plain HTML file.
#

###############################################################################
##                                                                           ##
##  Settings                                                                 ##
##                                                                           ##
###############################################################################

source_dir  := site
publish_dir := publish
remote_dir  := hcoop:Web/klingonska.org
ignore      := %.bak %.db %~ .\#% %\# %.tmp

CSS_MINIFIER := \
    $(if $(shell which yui-compressor),yui-compressor --type css,cat)
JS_MINIFIER := \
    $(if $(shell which yui-compressor),yui-compressor --type js,cat)

###############################################################################
##                                                                           ##
##  Functions                                                                ##
##                                                                           ##
###############################################################################

# Usage: $(call exclude-ignores,LIST...)

# Return list of the filenames in LIST which do not match any of the patterns
# in LIST. Matching is only made against the file name (excluding any path name
# part).
exclude-ignores = $(foreach file,$1,$(if \
    $(filter-out $(ignore),$(notdir $(file))),$(file)))

# These files are not processed, but included as-is in the published site.
copied_targets = \
    $(patsubst $(source_dir)/%,$(publish_dir)/%, \
        $(call exclude-ignores,$(shell find "$(source_dir)" -type f \
            -name '*.cgi'  -or \
            -name '*.css'  -or \
            -name '*.gif'  -or \
            -name '*.html' -or \
            -name '*.jpg'  -or \
            -name '*.ico'  -or \
            -name '*.js'   -or \
            -name '*.ly'   -or \
            -name '*.midi' -or \
            -name '*.mp3'  -or \
            -name '*.mp4'  -or \
            -name '*.ogg'  -or \
            -name '*.pdf'  -or \
            -name '*.png'  -or \
            -name '*.ps'   -or \
            -name '*.svg'  -or \
            -name '*.swf'  -or \
            -name '*.txt'  -or \
            -name '*.zdb'  -or \
            -name '*.zip'      \
    )))

# Each of these results in one published HTML file.
html_targets =                                    \
    $(patsubst $(source_dir)/%.txt,$(publish_dir)/%.html, \
        $(call exclude-ignores,$(wildcard        \
            $(source_dir)/*.txt                  \
            $(source_dir)/akademien/*.txt        \
            $(source_dir)/akademien/photos/*.txt \
            $(source_dir)/akademien/logo/*.txt   \
            $(source_dir)/canon/[a-z]*.txt       \
            $(source_dir)/dict/*.txt             \
            $(source_dir)/klo/*.txt              \
            $(source_dir)/piq/*.txt              \
            $(source_dir)/piqad/*.txt            \
            $(source_dir)/ref/*.txt              \
            $(source_dir)/songs/index.txt        \
            $(source_dir)/songs/america.txt      \
            $(source_dir)/songs/anthem/index.txt \
    )))

css_targets =                                               \
    $(patsubst $(source_dir)/%.scss,$(publish_dir)/%.css, \
        $(wildcard $(source_dir)/includes/*.scss          \
    ))

# HTML5 Boilerplate stuff
h5bp_zip   = $(wildcard htm5-boilerplate-*.zip)
h5bp_files = $(shell                                 \
    unzip -l $(h5bp_zip)                             \
        | awk '$$4 ~ /^\^/ { print substr($$4, 2) }' \
)
h5bp_dir = $(patsubst %/,%,$(firstword $(h5bp_files)))

# JS libs (i.e. Modernizr and jQuery -- included in HTML5 Boilerplate)
jslib_sources = $(filter $(h5bp_dir)/js/libs/%.min.js,$(h5bp_files))
jslib_targets = \
    $(patsubst %.min.js,$(publish_dir)/includes/%.js,  \
        $(notdir $(jslib_sources)))

all_targets = $(copied_targets) $(jslib_targets) $(css_targets) $(html_targets)


###############################################################################
##                                                                           ##
##  Targets                                                                  ##
##                                                                           ##
###############################################################################

## site - build web site
.PHONY: site css html js
site: $(all_targets)
## html - build HTML files of web site
html: $(filter %.html,$(all_targets))
## css - build CSS files of web site
css: $(filter %.css,$(all_targets))
## js - build Javascript files of web site
js: $(filter %.js,$(all_targets))

## ls-compiled - list compiled files
## ls-copied - list files used as-is
.PHONY: ls-compiled ls-copied
ls-compiled:
	@for LINE in $(jslib_targets) $(css_targets) $(html_targets); do \
	    echo $$LINE; \
	done | if [ -t 1 ]; then column; else cat; fi
ls-copied:
	@for LINE in $(copied_targets); do \
	    echo $$LINE; \
	done | if [ -t 1 ]; then column; else cat; fi

## auto - autorun 'make site' when files change
.PHONY: auto
auto: site
	@echo "================================================================="; \
	echo "Auto Build Mode."; \
	echo "Watching '$(source_dir)/' and rebuilding files as they change."; \
	echo "Press ^C to stop.";          \
	if which notify-send >/dev/null &&       \
	    [ -n $$DISPLAY ]; then               \
	    out() {                              \
	        echo "$$1 $$2";                  \
	        notify-send -u critical          \
	            "$$1" "$$2";                 \
	    };                                   \
	else                                     \
	    out() { echo "$$1 $$2"; };           \
	fi;                                      \
	inotifywait                              \
	    --event=CLOSE_WRITE                  \
	    --exclude='/[.#][^/]*$$'             \
	    --monitor                            \
	    --quiet                              \
	    --recursive $(source_dir)            \
	    | while read FILE; do                \
	        FILE="$${FILE%% *}$${FILE##* }"; \
	        echo "File '$$FILE' changed";    \
	        RESULT="Failed to process";      \
	        make --no-print-directory        \
	            | sed 's/^/    /'            \
	            && RESULT="Processed";       \
	        out "$$RESULT" $$FILE;           \
	    done

## publish - rsync generated web site to web host
.PHONY: publish
publish: .publish.done
.publish.done: $(all_targets)
	@if [ "$(CSS_MINIFIER)" = cat -o "$(JS_MINIFIER)" = cat ]; then \
	    echo "ERROR: Javascript/CSS is not minified,"      \
	        "won't publish site without minification" >&2; \
	    exit 1;                                            \
	fi;                                                    \
	bin/check-dict <site/dict/dict.zdb --checksum || {     \
	    echo "    in 'site/dict/dict.zdb'" >&2;            \
	    exit 1;                                            \
	};                                                     \
	echo "Publishing site to '$(remote_dir)':";            \
	rsync -Pac --exclude-from=.gitignore --delete-excluded \
	     --delete-after $(publish_dir)/ $(remote_dir)      \
	     && echo "Last published from here: `date`" >"$@"

## fetch - fetch published site
.PHONY: fetch
fetch:
	@if [ ! -e fetched ]; then                        \
	    [ -e $(publish_dir) ] || make site;           \
	    cp -a publish fetched;                        \
	fi;                                               \
	echo "Fetching published site to 'fetched':";     \
	rsync -Pac --delete-after $(remote_dir)/ fetched/

## linkcheck - check internal web page links
.PHONY: linkcheck
linkcheck: $(all_targets)
	@echo "Checking <a href=\"...\"> links in all HTML files:"
	@bin/linkcheck `find "$(publish_dir)" -type f '(' -iname "*.html" '!' -iname ".*" ')'`

## clean - remove all generated files
.PHONY: clean
clean:
	@if [ -e $(publish_dir) ]; then \
	    rm -vf $(all_targets);        \
	    rmdir --ignore-fail-on-non-empty -vp `find publish -type d -empty`; \
	fi

## help - display this information
.PHONY: help
help:
	@echo "Available targets:";                     \
	cat "$(CURDIR)/Makefile"                      | \
	    awk '/^## [^ ]/{sub(/^## */,"  ");print}' | \
	    sort

# HTML5 Boilerplate zipfile
$(h5bp_files): $(h5bp_zip)
	@echo "Unzipping  '$<'"; \
	unzip -qDD "$<"

# CGI (server-side script)
$(publish_dir)/%.cgi: $(source_dir)/%.cgi
	@[ -e "$(@D)" ] || mkdir -p "$(@D)"; \
	echo "Copying    '$<' -> '$@'";      \
	cp "$<" "$@"

# SCSS (sassy stylesheet) + CSS normalizer -> minified base CSS
$(publish_dir)/includes/base.css: $(h5bp_dir)/css/style.css \
    $(source_dir)/includes/base.scss bin/sassy
	@[ -e "$(@D)" ] || mkdir -p "$(@D)";      \
	echo "CSSifying  '$(filter %.scss,$^)' -> '$@'"; \
	{                                         \
	    cat $(filter %.css,$^);               \
	    bin/sassy $(filter %.scss,$^);        \
	} | $(CSS_MINIFIER) >"$@"

# SCSS (sassy stylesheet) -> minified CSS
$(publish_dir)/%.css: $(source_dir)/%.scss bin/sassy
	@[ -e "$(@D)" ] || mkdir -p "$(@D)";      \
	echo "Processing '$<' -> '$@'";           \
	bin/sassy $(filter %.scss,$^) |           \
	    $(CSS_MINIFIER) >"$@"

# CSS (stylesheet) -> minified CSS
$(publish_dir)/%.css: $(source_dir)/%.css
	@[ -e "$(@D)" ] || mkdir -p "$(@D)"; \
	echo "Minifying  '$<' -> '$@'";      \
	$(CSS_MINIFIER) <"$<" >"$@"

# GIF (bitmap image)
$(publish_dir)/%.gif: $(source_dir)/%.gif
	@[ -e "$(@D)" ] || mkdir -p "$(@D)"; \
	echo "Copying    '$<' -> '$@'";      \
	cp "$<" "$@"

# HTML (hypertext)
$(publish_dir)/%.html: $(source_dir)/%.html
	@[ -e "$(@D)" ] || mkdir -p "$(@D)"; \
	echo "Copying    '$<' -> '$@'";      \
	cp "$<" "$@"

# KA Markdown -> HTML
$(publish_dir)/dict/%.html: $(source_dir)/dict/%.txt bin/parse \
    parse-data/parser-markdown-ka parse-data/composer-html-ka2 \
    parse-data/transformer-html-ka2 perl/ParserComposer.pm
	@[ -e "$(@D)" ] || mkdir -p "$(@D)";      \
	echo "HTMLifying '$<' -> '$@'";           \
	bin/parse                                 \
	    --input=parse-data/parser-markdown-ka \
	    --apply=parse-data/transformer-html-ka2 \
	    --output=parse-data/composer-html-ka2 \
	    <"$<" >"$@";                          \
	    [ -s "$@" ] || rm "$@"

# KA Markdown -> HTML
$(publish_dir)/klo/%.html: $(source_dir)/klo/%.txt \
    $(source_dir)/klo/includes/template.html     \
    bin/markdown2html-old
	@[ -e "$(@D)" ] || mkdir -p "$(@D)";     \
	rm -f "$@";                              \
	bin/markdown2html-old                    \
	    --base="$(source_dir)"               \
	    --output="$@"                        \
	    "$<"

# KA Markdown -> HTML
$(publish_dir)/%.html: $(source_dir)/%.txt \
    $(source_dir)/includes/template.html   \
    bin/markdown2html
	@[ -e "$(@D)" ] || mkdir -p "$(@D)";     \
	rm -f "$@";                              \
	bin/markdown2html                        \
	    --base="$(source_dir)"               \
	    --output="$@"                        \
	    --template="includes/template.html"  \
	    "$<"

# ICO (browser favicon)
$(publish_dir)/favicon.ico: $(source_dir)/favicon.ico
	@[ -e "$(@D)" ] || mkdir -p "$(@D)"; \
	echo "Copying    '$<' -> '$@'";      \
	cp "$<" "$@"

# JPEG (bitmap image)
$(publish_dir)/%.jpg: $(source_dir)/%.jpg
	@[ -e "$(@D)" ] || mkdir -p "$(@D)"; \
	echo "Copying    '$<' -> '$@'";      \
	cp "$<" "$@"

# JS (client-side script, Javascript)
# (Script appears to use MSIE hacks and gets mangled in minification.)
$(publish_dir)/includes/sorttable.js: $(source_dir)/includes/sorttable.js
	@[ -e "$(@D)" ] || mkdir -p "$(@D)"; \
	echo "Copying    '$<' -> '$@'";      \
	cp "$<" "$@"

# JS (client-side libraries, Javascript)
$(publish_dir)/includes/%.js: $(h5bp_dir)/js/libs/%.min.js
	@[ -e "$(@D)" ] || mkdir -p "$(@D)"; \
	echo "Copying    '$<' -> '$@'";      \
	cp "$<" "$@"

# JS (client-side script, Javascript)
$(publish_dir)/%.js: $(source_dir)/%.js
	@[ -e "$(@D)" ] || mkdir -p "$(@D)"; \
	echo "Minifying  '$<' -> '$@'";      \
	$(JS_MINIFIER) <"$<" >"$@"

# JS (client-side script, Javascript)
$(publish_dir)/%.js: $(source_dir)/%.js
	@[ -e "$(@D)" ] || mkdir -p "$(@D)"; \
	echo "Minifying  '$<' -> '$@'";      \
	$(JS_MINIFIER) <"$<" >"$@"

# LY (typeset musical score, Lilypond)
$(publish_dir)/%.ly: $(source_dir)/%.ly
	@[ -e "$(@D)" ] || mkdir -p "$(@D)"; \
	echo "Copying    '$<' -> '$@'";      \
	cp "$<" "$@"

# MIDI (audio)
$(publish_dir)/%.midi: $(source_dir)/%.midi
	@[ -e "$(@D)" ] || mkdir -p "$(@D)"; \
	echo "Copying    '$<' -> '$@'";      \
	cp "$<" "$@"

# MP3 (audio)
$(publish_dir)/%.mp3: $(source_dir)/%.mp3
	@[ -e "$(@D)" ] || mkdir -p "$(@D)"; \
	echo "Copying    '$<' -> '$@'";      \
	cp "$<" "$@"

# MP4 (video)
$(publish_dir)/%.mp4: $(source_dir)/%.mp4
	@[ -e "$(@D)" ] || mkdir -p "$(@D)"; \
	echo "Copying    '$<' -> '$@'";      \
	cp "$<" "$@"

# OGG (audio)
$(publish_dir)/%.ogg: $(source_dir)/%.ogg
	@[ -e "$(@D)" ] || mkdir -p "$(@D)"; \
	echo "Copying    '$<' -> '$@'";      \
	cp "$<" "$@"

# PDF (typeset document, PDF)
$(publish_dir)/%.pdf: $(source_dir)/%.pdf
	@[ -e "$(@D)" ] || mkdir -p "$(@D)"; \
	echo "Copying    '$<' -> '$@'";      \
	cp "$<" "$@"

# PNG (bitmap image)
$(publish_dir)/%.png: $(source_dir)/%.png
	@[ -e "$(@D)" ] || mkdir -p "$(@D)"; \
	echo "Copying    '$<' -> '$@'";      \
	cp "$<" "$@"

# PS (typeset document, Postscript)
$(publish_dir)/%.ps: $(source_dir)/%.ps
	@[ -e "$(@D)" ] || mkdir -p "$(@D)"; \
	echo "Copying    '$<' -> '$@'";      \
	cp "$<" "$@"

# SVG (vector image)
$(publish_dir)/%.svg: $(source_dir)/%.svg
	@[ -e "$(@D)" ] || mkdir -p "$(@D)"; \
	echo "Copying    '$<' -> '$@'";      \
	cp "$<" "$@"

# SWF (client-side program, Shockwave Flash)
$(publish_dir)/%.swf: $(source_dir)/%.swf
	@[ -e "$(@D)" ] || mkdir -p "$(@D)"; \
	echo "Copying    '$<' -> '$@'";      \
	cp "$<" "$@"

# TXT (text file)
$(publish_dir)/%-tkd.txt: $(source_dir)/%-tkd.txt
	@[ -e "$(@D)" ] || mkdir -p "$(@D)"; \
	echo "Processing \`$<' -> \`$@'"; \
	tr '[a-m][n-z][A-M][N-Z]' '[n-z][a-m][N-Z][A-M]' <"$<" >"$@"

# TXT (text files)
$(publish_dir)/%-ck.txt: $(source_dir)/%-ck.txt
	@[ -e "$(@D)" ] || mkdir -p "$(@D)"; \
	echo "Processing \`$<' -> \`$@'"; \
	tr '[a-m][n-z][A-M][N-Z]' '[n-z][a-m][N-Z][A-M]' <"$<" >"$@"

# TXT (text files)
$(publish_dir)/%-pk.txt: $(source_dir)/%-pk.txt
	@[ -e "$(@D)" ] || mkdir -p "$(@D)"; \
	echo "Processing \`$<' -> \`$@'"; \
	tr '[a-m][n-z][A-M][N-Z]' '[n-z][a-m][N-Z][A-M]' <"$<" >"$@"

# TXT (text files)
$(publish_dir)/%-tkw.txt: $(source_dir)/%-tkw.txt
	@[ -e "$(@D)" ] || mkdir -p "$(@D)"; \
	echo "Processing \`$<' -> \`$@'"; \
	tr '[a-m][n-z][A-M][N-Z]' '[n-z][a-m][N-Z][A-M]' <"$<" >"$@"

# TXT (text files)
$(publish_dir)/%-kgt.txt: $(source_dir)/%-kgt.txt
	@[ -e "$(@D)" ] || mkdir -p "$(@D)"; \
	echo "Processing \`$<' -> \`$@'"; \
	tr '[a-m][n-z][A-M][N-Z]' '[n-z][a-m][N-Z][A-M]' <"$<" >"$@"

# TXT (text files)
$(publish_dir)/%.txt: $(source_dir)/%.txt
	@[ -e "$(@D)" ] || mkdir -p "$(@D)"; \
	echo "Copying    '$<' -> '$@'";      \
	cp "$<" "$@"

# ZDB (text database)
$(publish_dir)/%.zdb: $(source_dir)/%.zdb
	@[ -e "$(@D)" ] || mkdir -p "$(@D)"; \
	echo "Copying    '$<' -> '$@'";      \
	cp "$<" "$@"

# ZIP (compressed archive)
$(publish_dir)/%.zip: $(source_dir)/%.zip
	@[ -e "$(@D)" ] || mkdir -p "$(@D)"; \
	echo "Copying    '$<' -> '$@'";      \
	cp "$<" "$@"

#[eof]
