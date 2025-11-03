
@rem https://stackoverflow.com/a/37478183

@rem with audio 
@rem -i audio.ogg -c:a copy -shortest
@rem "   -shortest           finish encoding within shortest input   "

@rem DOES NOT WORK
@rem ffmpeg -framerate 15 -pattern_type glob -i '*.png' -c:v libx264 -pix_fmt yuv420p out.mp4
@rem '*.png': Invalid argument


@rem As the glob command is not available on windows, because its a POSIX implementation, the workaround is to use sequence as a pattern. For this to work, one needs to rename their files with sequence numbers - like
@rem gym01.jpg
@rem gym02.jpg
@rem ...
@rem Then we can use the command below on Windows - NOTE the gym%02d.jpg, where if your sequence contains more than 2 chars (eg, gym00001.jpg), change it accordingingly (gym%05d.jpg)

@rem double percent needed because cmd interprets %0 as its own argument and fills in the script name
ffmpeg -framerate 15 -pattern_type sequence -i o%%06d.png -s:v 1920x1080 -c:v libx264 -pix_fmt yuv420p out.mp4