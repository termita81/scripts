@rem double percent needed because cmd interprets %0 as its own argument and fills in the script name
ffmpeg -i %1 "%1_%%06d.jpg"