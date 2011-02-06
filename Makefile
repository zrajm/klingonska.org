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

# data for remote host (used by "beta" and "release" targets)
REMOTE_HOST           := hcoop
REMOTE_KERB_PRINCIPAL := zrajm@HCOOP.NET
REMOTE_PATH_BETA      := klingonska.org/beta
REMOTE_PATH_RELEASE   := klingonska.org/main

TIMESTAMP_FILE_BETA   := .uploaded_beta
TIMESTAMP_FILE_RELEASE:= .uploaded_release

# options for uploading with rsync
RSYNCFLAGS = --delete-after --delete-excluded --exclude-from=".gitignore"


###############################################################################
##                                                                           ##
##  Functions                                                                ##
##                                                                           ##
###############################################################################

# list of HTML files to generate
generated_html_files = $(patsubst %.txt, %.html, \
	$(wildcard klo/*.txt dict/*.txt)         \
	akademien/logo/index.txt                 \
	canon/index.txt                          \
)

# Some terminal escape settings
bold   = \\033[1m# Escape sequence for bold text
normal = \\033[m#  Escape sequence to reset text settings

# Usage: $(call upload,REMOTE_HOST,REMOTE_PATH[,KERBEROS_PRINCIPAL])
#
# Uses rsync to upload stuff to REMOTE_PATH of REMOTE_HOST. If
# KERBEROS_PRINCIPAL is specified (this also requires the appropriate GSSAPI
# settings in ~/.ssh/config to work) then ACLs will be set for the uploaded
# files (this only works on HCoop since the "fsr" command is used -- a
# HCoop-specific recursive version of the normal "fs" command -- and the ACL
# username is hardcoded as "zrajm.daemon").
upload = \
    if [ "$(3)" ]; then                                \
        if klist | grep -q "Principal: $(3)$$"; then   \
            echo "Got credentials,"                    \
                 "password not needed ($(3))";         \
        else                                           \
            kinit "$(3)" || exit 1;                    \
        fi;                                            \
    fi;                                                \
    rsync -Pa $(RSYNCFLAGS) . $(1):$(2);               \
    if [ "$(3)" ]; then                                \
        ssh "$(1)" "fsr setacl $(2) zrajm.daemon rl" & \
    fi


###############################################################################
##                                                                           ##
##  Targets                                                                  ##
##                                                                           ##
###############################################################################

## all - alias for "html"
.PHONY: all
all: html

## html - build HTML files (which files are build is given in Makefile)
.PHONY: html
html: $(generated_html_files)

dict/%.html: dict/%.txt
	@echo "Processing '$<' -> '$@'";                \
	usr/bin/parse                                   \
	     --input=usr/parse-data/parser-markdown-ka  \
	    --output=usr/parse-data/composer-html-ka2   \
	    <"$<" >"$@";                                \
	    [ -s "$@" ] || rm "$@"

# FIXME: should depend on all includes required by the HMTL file
%.html: %.txt
	@rm -f "$@"
	@usr/bin/markdown2html "$?" --output="%.html"

## clean - remove all generated files
.PHONY: clean
clean:
	@rm -vf $(generated_html_files)

## help - display this information
.PHONY: help
help:
	@echo "Available targets:"
	@cat $(CURDIR)/Makefile | awk '/^## [^ ]/ { sub(/^## */, "  "); print }' | sort
	@echo

## check_links - check internal web page links
.PHONY: check_links
check_links:
	@echo "Checking <a href=\"...\"> links in all HTML files:"
	@usr/bin/linkcheck `find . -type f '(' -iname "*.html" '!' -iname ".*" ')'`

## test - some sort of test of something
.SECONDEXPANSION:
good = $(patsubst %.txt, %.good, $(wildcard usr/test/*.txt))
test: $(good)
.PHONY: $(good)
$(good): $$(patsubst %.good, %.html, $$@)
	@diff $@ $< && \
	    echo "OK $<"

#[eof]
