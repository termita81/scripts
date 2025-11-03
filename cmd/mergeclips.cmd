@rem mylist.txt must contain records like: 
@rem file 'path/to/file'

@del mylist.txt 2>nul

setlocal EnableDelayedExpansion
set "prefix="
for /f "delims=" %%a in ('dir /b *.mp4^| findstr /v ".txt"') do (
	echo file '%%a' >> mylist.txt
)

ffmpeg -f concat -safe 0 -i mylist.txt -c copy o.mp4