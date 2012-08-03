/*
This script waits for an array of numbers formatted to draw
 the LoLShield display to be sent over the serial connection,
 then draws them to the shield
 */

#include <Charliplexing.h> //Imports the library, which needs to be
//Initialized in setup.
int numRows = 9;
int numCols = 14;
char* nextRowChars; //for splitting the input string
uint16_t nextRow; //holder for next row
uint16_t frame[9] {
  0,0,0,0,0,0,0,0,0};
char* sequence;
int i;
int j;
char * pEnd; //don't need the val but it's needed for strtol

void setup() {
  LedSign::Init();  //Initializes the screen
  Serial.begin(9600);
  Serial.println("hello");
}

/**
 * Reads from serial & draws to shield
 */
unsigned long rowData;
void loop() {

  int i=0;
  char commandbuffer[100];

  if(Serial.available()){
    delay(100);
    while( Serial.available() && i< 99) {
      commandbuffer[i++] = Serial.read();
    }
    commandbuffer[i++]='\0';
  }
  if(i>0)
  {
    //Serial.println((char*)commandbuffer);

    sequence = (char*)commandbuffer;
    //break the string up into an array (run atoi on storage)
    nextRowChars = strtok(sequence,",");
    j = 0;
    //     Serial.println("start");
    while(nextRowChars != NULL){
      frame[j] = atoi(nextRowChars);
      //       Serial.println((char*)nextRowChars);
      nextRowChars = strtok(NULL,",");
      j++;
    }
    //     Serial.println("stop");
    //pass to drawFrame
    drawFrame(frame, numRows);

    //not using this
    if (false){    
      byte line = 0; //line counter

      rowData = atoi(commandbuffer); 
      for (byte led=0; led<14; ++led) {
        if (rowData & (1<<led)) {
          LedSign::Set(led, line, 1);
        }
        else {
          LedSign::Set(led, line, 0);
        }
      }
    }
  }// if false



  //    drawFrame(frame, numRows);
  //  delay(1000);
}


void drawFrame(uint16_t frameData[], size_t size)
{
  char debug_buffer[100];
  sprintf(debug_buffer, "size: %i", size);
  Serial.println(debug_buffer);

  //  LedSign::Clear(0);
  byte line = 0; //line counter
  uint16_t rowData; //temp store the data for each row

  //each line
  for(line = 0; line < size; line++) {
    rowData = frameData[line];
    Serial.println(rowData);
    //each led
    for (byte led=0; led<14; ++led) {
      if (rowData & (1<<led)) {
        LedSign::Set(led, line, 1);
      }
      else {
        LedSign::Set(led, line, 0);
      }
    }
  }
}

