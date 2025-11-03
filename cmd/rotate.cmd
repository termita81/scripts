@echo ffmpeg -i VID_20230730_100533.mp4 -vf "transpose=2" "%%04d.png"
@echo 0 = 90deg counterclockwise and vertical flip (default)
@echo 1 = 90deg clockwise
@echo 2 = 90deg counterclockwise
@echo 3 = 90deg clockwise and vertical flip