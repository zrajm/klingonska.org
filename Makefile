
# Note: SSI HCOOP only works if the included page is *not* a script.

webpage := $(shell basename `pwd`)

all:
	@echo $(webpage)

# FIXME: use timestamp file to know when to *not* install files
install: all
	@echo "\033[1mInstalling \"$(webpage)\" on HCOOP\033[0m"
	rsync -Pa --delete-after --delete-excluded \
          --exclude '*~'   \
          --exclude '.git' \
          --exclude '#*#'  \
          --exclude '.#*'  \
          . hcoop:test.zrajm.org
	ssh hcoop "fsr setacl . zrajm.daemon rl"

#[eof]
