
# Note: SSI HCOOP only works if the included page is *not* a script.

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
    find -type f -newer $(rsync) ! -name .rsync )


all:
	@echo $(webpage)

.phony: install
install: $(rsync)


$(rsync): $(rsync_dep)
	@echo "\033[1mUploading \"$(webpage)\" to HCOOP\033[0m"
	@echo Updated files: $(rsync_dep)
	@klist -t || kinit $(krb_name)
	rsync -Pa $(rsync_options) . $(strip $(ssh_host)):$(webpage)
	@touch $(rsync)
	@ssh $(ssh_host) "fsr setacl . zrajm.daemon rl" &

#[eof]
