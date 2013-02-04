on run {movieFile}    
  try
    tell application "iFlicks"
      import movieFile as QuickTime movie with deleting without gui
    end tell
  end try
        
  return movieFile
end run