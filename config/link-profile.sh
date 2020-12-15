#!/bin/sh

# Forked from Yarn's install scripts
link_profile() {
  printf "$cyan> Adding to \$PATH...$reset\n"
  SOURCE_STR="\nsource $SIMPLE_PATH/.simplerc\n"

  printf "---------------"
  printf $SIMPLE_PROFILE
  printf "---------------"

  if [ -z "${SIMPLE_PROFILE-}" ] ; then
    printf "$red> Profile not found. Tried ${SIMPLE_PROFILE} (as defined in \$PROFILE), ~/.bashrc, ~/.bash_profile, ~/.zshrc, and ~/.profile.\n"
    echo "> Create one of them and run this script again"
    echo "> Create it (touch ${SIMPLE_PROFILE}) and run this script again"
    echo "   OR"
    printf "> Append the following lines to the correct file yourself:$reset\n"
    command printf "${SOURCE_STR}"
  else
    if ! grep -q "$SIMPLE_PATH/bin" "$SIMPLE_PROFILE"; then
      if [[ $SIMPLE_PROFILE == *"fish"* ]]; then
        command fish -c 'set -U fish_user_paths $fish_user_paths '"$SIMPLE_PATH/bin"
        printf "$cyan> We've added '"$SIMPLE_PATH/bin"' to your fish_user_paths universal variable\n"
      else
        command printf "$SOURCE_STR" >> "$SIMPLE_PROFILE"
        printf "$cyan> We've added the following to your $SIMPLE_PROFILE\n"
      fi
      
      echo "> If this isn't the profile of your current shell then please add the following to your correct profile:"
      printf "   $SOURCE_STR$reset\n"
    fi
  fi
}

link_profile