<?php
	$fhandle = fopen('/var/tmp/lss_shield.txt',w);
	fwrite($fhandle,$_POST['frame']);
	fclose($fhandle);
?>
