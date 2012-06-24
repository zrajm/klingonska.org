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


###############################################################################
##                                                                           ##
##  Functions                                                                ##
##                                                                           ##
###############################################################################

copied_source_files = \
    $(shell find "$(source_dir)" -type f \
        -name '*.cgi'  -or \
        -name '*.css'  -or \
        -name '*.gif'  -or \
        -name '*.html' -or \
        -name '*.jpg'  -or \
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
    )                      \
    $(source_dir)/favicon.ico

processed_source_files = \
    $(wildcard                             \
        $(source_dir)/akademien/logo/*.txt \
        $(source_dir)/canon/index.txt      \
        $(source_dir)/dict/*.txt           \
        $(source_dir)/download.txt         \
        $(source_dir)/errors.txt           \
        $(source_dir)/index.txt            \
        $(source_dir)/klcp.txt             \
        $(source_dir)/klo/*.txt            \
    )

copied_files    = $(patsubst $(source_dir)/%,$(publish_dir)/%,$(copied_source_files))
processed_files = $(patsubst $(source_dir)/%.txt,$(publish_dir)/%.html,$(processed_source_files))
all_files       = $(copied_files) $(processed_files)


###############################################################################
##                                                                           ##
##  Targets                                                                  ##
##                                                                           ##
###############################################################################

## site - build web site
.PHONY: site
site: $(copied_files) $(processed_files)

## publish - rsync generated web site to web host
.PHONY: publish
publish: .publish.done
.publish.done: $(all_files)
	@echo "Publishing site to '$(remote_dir)':"; \
	rsync -Pac --delete $(publish_dir)/ $(remote_dir) && \
	echo "Last published from here: `date`" >$@

## linkcheck - check internal web page links
.PHONY: linkcheck
linkcheck: $(all_files)
	@echo "Checking <a href=\"...\"> links in all HTML files:"
	@bin/linkcheck `find "$(publish_dir)" -type f '(' -iname "*.html" '!' -iname ".*" ')'`

## clean - remove all generated files
.PHONY: clean
clean:
	@if [ -e $(publish_dir) ]; then \
	    rm -vf $(all_files);        \
	    rmdir --ignore-fail-on-non-empty -vp `find publish -type d -empty`; \
	fi

## help - display this information
.PHONY: help
help:
	@echo "Available targets:"
	@cat $(CURDIR)/Makefile | awk '/^## [^ ]/ { sub(/^## */, "  "); print }' | sort

# CGI (server-side script)
$(publish_dir)/%.cgi: $(source_dir)/%.cgi
	@[ -e "$(@D)" ] || mkdir -p "$(@D)"; \
	cp -v "$<" "$@"

# CSS (stylesheet)
$(publish_dir)/%.css: $(source_dir)/%.css
	@[ -e "$(@D)" ] || mkdir -p "$(@D)"; \
	cp -v "$<" "$@"

# GIF (bitmap image)
$(publish_dir)/%.gif: $(source_dir)/%.gif
	@[ -e "$(@D)" ] || mkdir -p "$(@D)"; \
	cp -v "$<" "$@"

# HTML (hypertext)
$(publish_dir)/%.html: $(source_dir)/%.html
	@[ -e "$(@D)" ] || mkdir -p "$(@D)"; \
	cp -v "$<" "$@"

# HTML (hypertext) -- own markdown processor
$(publish_dir)/dict/%.html: $(source_dir)/dict/%.txt
	@[ -e "$(@D)" ] || mkdir -p "$(@D)";        \
	echo "Processing '$<' -> '$@'";             \
	bin/parse                                   \
	     --input=parse-data/parser-markdown-ka  \
	    --output=parse-data/composer-html-ka2   \
	    <"$<" >"$@";                            \
	    [ -s "$@" ] || rm "$@"

# HTML (hypertext) -- own markdown processor
$(publish_dir)/%.html: $(source_dir)/%.txt \
	$(source_dir)/includes/template.html bin/markdown2html
	@[ -e "$(@D)" ] || mkdir -p "$(@D)";         \
	rm -f "$@";                                  \
	bin/markdown2html "$<" --base="$(source_dir)" --output="$@"

# ICO (browser favicon)
$(publish_dir)/favicon.ico: $(source_dir)/favicon.ico
	@[ -e "$(@D)" ] || mkdir -p "$(@D)"; \
	cp -v "$<" "$@"

# JPEG (bitmap image)
$(publish_dir)/%.jpg: $(source_dir)/%.jpg
	@[ -e "$(@D)" ] || mkdir -p "$(@D)"; \
	cp -v "$<" "$@"

# JS (client-side script, Javascript)
$(publish_dir)/%.js: $(source_dir)/%.js
	@[ -e "$(@D)" ] || mkdir -p "$(@D)"; \
	cp -v "$<" "$@"

# LY (typeset musical score, Lilypond)
$(publish_dir)/%.ly: $(source_dir)/%.ly
	@[ -e "$(@D)" ] || mkdir -p "$(@D)"; \
	cp -v "$<" "$@"

# MIDI (audio)
$(publish_dir)/%.midi: $(source_dir)/%.midi
	@[ -e "$(@D)" ] || mkdir -p "$(@D)"; \
	cp -v "$<" "$@"

# MP3 (audio)
$(publish_dir)/%.mp3: $(source_dir)/%.mp3
	@[ -e "$(@D)" ] || mkdir -p "$(@D)"; \
	cp -v "$<" "$@"

# MP4 (video)
$(publish_dir)/%.mp4: $(source_dir)/%.mp4
	@[ -e "$(@D)" ] || mkdir -p "$(@D)"; \
	cp -v "$<" "$@"

# OGG (audio)
$(publish_dir)/%.ogg: $(source_dir)/%.ogg
	@[ -e "$(@D)" ] || mkdir -p "$(@D)"; \
	cp -v "$<" "$@"

# PDF (typeset document, PDF)
$(publish_dir)/%.pdf: $(source_dir)/%.pdf
	@[ -e "$(@D)" ] || mkdir -p "$(@D)"; \
	cp -v "$<" "$@"

# PNG (bitmap image)
$(publish_dir)/%.png: $(source_dir)/%.png
	@[ -e "$(@D)" ] || mkdir -p "$(@D)"; \
	cp -v "$<" "$@"

# PS (typeset document, Postscript)
$(publish_dir)/%.ps: $(source_dir)/%.ps
	@[ -e "$(@D)" ] || mkdir -p "$(@D)"; \
	cp -v "$<" "$@"

# SVG (vector image)
$(publish_dir)/%.svg: $(source_dir)/%.svg
	@[ -e "$(@D)" ] || mkdir -p "$(@D)"; \
	cp -v "$<" "$@"

# SWF (client-side program, Shockwave Flash)
$(publish_dir)/%.swf: $(source_dir)/%.swf
	@[ -e "$(@D)" ] || mkdir -p "$(@D)"; \
	cp -v "$<" "$@"

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
	cp -v "$<" "$@"

# ZDB (text database)
$(publish_dir)/%.zdb: $(source_dir)/%.zdb
	@[ -e "$(@D)" ] || mkdir -p "$(@D)"; \
	cp -v "$<" "$@"

# ZIP (compressed archive)
$(publish_dir)/%.zip: $(source_dir)/%.zip
	@[ -e "$(@D)" ] || mkdir -p "$(@D)"; \
	cp -v "$<" "$@"

#[eof]
