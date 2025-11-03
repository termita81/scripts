@echo shrink to vertical size specified in second argument
@echo	-vf scale=-2:%2
@echo keeping aspect ratio
@echo	,setsar=1:1
@echo no audio
@echo 	-an
@echo rem 15 fps
@echo rem 	-r 15
@echo save to new file with "_shrink" appended to name of input file
@echo 	"%~n1_shrink.mp4"
@echo overwrite output files
@echo 	-y

ffmpeg -y -i %1 -vf scale=-2:%2,setsar=1:1 "%~n1_shrink.mp4"