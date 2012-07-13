<?php
	if(array_key_exists('ping',$_POST)){
		exit('pong');
	}
//this will not work unless
//a) serial_device points to your arduino serial connection
//b) you OS takes data written to the device location and sends it over the
//   serial connection at 9600 baud (linux just seems to do this)
//c) the user running PHP interpreter (e.g. apache) can write to the device
//   Super Duper Secure Method Of Achieving This: sudo chmod 777 /dev/ttyUSB0
	$serial_device = '/dev/ttyUSB0';
	file_put_contents($serial_device , $_POST['frame']);
?>
