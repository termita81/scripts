@rem ratio subunitar to speed up
@rem https://trac.ffmpeg.org/wiki/How%20to%20speed%20up%20/%20slow%20down%20a%20video
ffmpeg -i %1 -filter:v "setpts=%2*PTS" %1_changed.mp4



@rem https://superuser.com/a/1559967
@rem FFmpeg now has a crossfade filter, released in version 4.3.
@rem ffmpeg -i 1.mp4 -i 2.mp4 -filter_complex "xfade=offset=4.5:duration=1" output.mp4
@rem And similarly, there's an audio version.
@rem ffmpeg -i 1.mp4 -i 2.mp4 -filter_complex "xfade=offset=4.5:duration=1;acrossfade=duration=1" output.mp4








rem https://stackoverflow.com/a/48670997
REM ffmpeg -i in.mp4 -i main.mp4 -i out.mp4 -filter_complex \
  REM "[0:v]fade=type=out:duration=2:start_time=28,setpts=PTS-STARTPTS[v0]; \
   REM [1:v]fade=type=in:duration=2,fade=type=out:duration=2:start_time=28,setpts=PTS-STARTPTS[v1]; \
   REM [2:v]fade=type=in:duration=2,setpts=PTS-STARTPTS[v2]; \
   REM [v0][0:a][v1][1:a][v2][2:a]concat=n=3:v=1:a=1[v][a]" \
  REM -map "[v]" -map "[a]" output.mp4