#
# Note: SSI HCOOP only works if the included page is *not* a script.
#

# list of HTML files to generate
generated_html_files = $(patsubst %.txt, %.html, $(wildcard klo/*.txt)) # KLO files

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


.PHONY: all
all: html


.PHONY: html
html: $(generated_html_files)


# FIXME: should depend on all includes required by the HMTL file
%.html: %.txt
	usr/bin/markdown2html $? >$@


.PHONY: clean
clean:
	@rm -vf $(generated_html_files)


.PHONY: install
install: all $(rsync)


$(rsync): $(rsync_dep)
	@echo "\033[1mUploading \"$(webpage)\" to HCOOP\033[0m"
	@echo Updated files: $(rsync_dep)
	@klist -t || kinit $(krb_name)
	rsync -Pa $(rsync_options) . $(strip $(ssh_host)):$(webpage)
	@touch $(rsync)
	@ssh $(ssh_host) "fsr setacl . zrajm.daemon rl" &


.PHONY: help
help:
	@echo ""
	@echo "FIXME: Not yet implemented"
	@echo ""

#[eof]
