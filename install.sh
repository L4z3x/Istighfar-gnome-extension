#!/bin/bash

# Define color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'
BLUE='\033[0;34m'
# Functions for colored messages
success() {
    echo -e "${GREEN}[✔] $1${NC}"
}

error() {
    echo -e "${RED}[✖] $1${NC}"
}

info() {
    echo -e "${BLUE}[ℹ] $1${NC}"
}
# check gnome shell dir
if [[ ! -d "$HOME/.local/share/gnome-shell/" ]]; then
    error  "gnome-shell directory not found"
    exit 1
fi

cp -r "./" "$HOME/.local/share/gnome-shell/extensions/istighfar@islamic.dikra.lazaal" && success "Extension installed successfully!" || { error "Failed to move extension!"; exit 1; }

gnome-extensions enable istighfar@islamic.dikra.lazaal
success "extension successfully enabled"
info "NOTE: you need to reload gnome shell (logout) or press Alt+f2 then type 'r'"
