# -*- makefile -*-
#
# Note: SSI HCOOP only works if the included page is *not* a script.
#

# list of HTML files to generate
generated_html_files = $(patsubst %.txt, %.html, \
	$(wildcard klo/*.txt dict/*.txt)         \
	akademien/logo/index.txt                 \
	canon/index.txt                          \
)

webpage := $(shell basename `pwd`)

krb_name = zrajm@HCOOP.NET #   # Kerberos principal name
ssh_host = hcoop #             # host to connect to via SSH
rsync    = .rsync #            # "rsync" target timestamp file
rsync_options =       \
    --delete-after    \
    --delete-excluded \
    --exclude-from=".gitignore"

# Note: This returns a list of the updated files $(rsync) exist, otherwise it
# returns nothing, which causes the rsync to proceed. (Because no dependancy =
# always run.) 
rsync_dep = $(shell [ -e $(rsync) ] && \
    find -name .git -prune -o -type f -newer $(rsync) ! -name .rsync )


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

## clean - remove generated HTML files
.PHONY: clean
clean:
	@rm -vf $(generated_html_files)

## install - copy webpage to HCoop
.PHONY: install
install: all $(rsync)


$(rsync): $(rsync_dep)
	@echo "\033[1mUploading \"$(webpage)\" to HCOOP\033[0m"
	@echo Updated files: $(rsync_dep)
	@klist -t || kinit $(krb_name)
	rsync -Pa $(rsync_options) . $(strip $(ssh_host)):$(webpage)
	@touch $(rsync)
	@ssh $(ssh_host) "fsr setacl . zrajm.daemon rl" &

## help - Display this information
.PHONY: help
help:
	@echo "Available targets:"
	@cat $(CURDIR)/Makefile | awk '/^## [^ ]/ { sub(/^## */, "  "); print }' | sort
	@echo

## test - some sort of test of something
.SECONDEXPANSION:
good = $(patsubst %.txt, %.good, $(wildcard usr/test/*.txt))
test: $(good)
.PHONY: $(good)
$(good): $$(patsubst %.good, %.html, $$@)
	@diff $@ $< && \
	    echo "OK $<"

#[eof]
