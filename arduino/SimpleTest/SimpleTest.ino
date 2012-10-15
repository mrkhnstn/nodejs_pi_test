#include <stdlib.h> 

char deviceId[] = "arduino"; 
int ledPin = 13;
int buttonPin = 8;

boolean ledState = false;
int pwm = 0;
int buttonState = 0;
int sensorValue = 0;

int varIndex = 0;
int pathIndex = 0;
int readIndex = 0;
boolean interested = true;
char readBuffer[255];
String keyRead;
String valRead;

char compareString[] = "Mark Hauenstein";

void setup(){
  pinMode(ledPin,OUTPUT);
  pinMode(buttonPin,INPUT);
  Serial.begin(9600);
}

void loop(){

  while(Serial.available() > 0){
    char c = Serial.read();
    if(interested){
      if(c == '/'){
        readBuffer[readIndex] = '\0';
        // read a path segment
        if(pathIndex == 0){
          // first path segment
          //check agains deviceId
          if(strcmp(readBuffer,deviceId) == 0){
            Serial.print("deviceId:");
            Serial.println(readBuffer);
            pathIndex++;
            readIndex = 0;
          } else {
            interested = false;
            pathIndex = 0;
            readIndex = 0;
          }
        } else {
            //other path segments
            Serial.print("path ");
            Serial.println(pathIndex,DEC);
            Serial.println(readBuffer);
            pathIndex++;
            readIndex = 0;
        }
        readIndex = 0;
      } else if(c == ':'){
        readBuffer[readIndex] = '\0';

        Serial.print("path ");
        Serial.println(pathIndex,DEC);
        Serial.println(readBuffer);
        
        if(strcmp(readBuffer,"led") == 0){
          Serial.print("led");
          //found led
          pathIndex = 0;
          varIndex = 1;
        } else {
            interested = false;
            pathIndex = 0;
            readIndex = 0;
        }
        readIndex = 0;
      } else if(c == '\r'){ // cariage return
        readBuffer[readIndex] = '\0';
        // found value
        Serial.print("value ");
        Serial.println(readBuffer);
        
        if(varIndex == 1){
          pwm = atoi(readBuffer);
          Serial.println(pwm);
        }
        
        interested = true;
        pathIndex = 0;
        readIndex = 0;
        varIndex = 0;
      } else { // no special character found
        // add to read buffer
        readBuffer[readIndex] = c;
        readIndex++;
      }
    } else { // not interested
      if(c == '\r'){ // wait for return
        // start from the beginning
        interested = true;
        pathIndex = 0;
        readIndex = 0;
      }
    }
  }
  
  boolean changed = false;
  
  int newSensorValue = analogRead(A0);
  if(abs(newSensorValue - sensorValue) > 5){
     sensorValue = newSensorValue;
     Serial.print(deviceId);
     Serial.print("/analog:");
     Serial.println(sensorValue,DEC);
  }
 
  boolean newButtonState = digitalRead(buttonPin);
  if(buttonState != newButtonState){
    buttonState = newButtonState;
    Serial.print(deviceId);
    Serial.print("/button:");
    Serial.println(buttonState,DEC);
  }

  /*
  if(ledState){
    digitalWrite(ledPin, HIGH);
  } else {
    digitalWrite(ledPin, LOW);
  }
  ledState = !ledState;
  */
  
  delay(100);
}

int8_t satoi( char *str ){  
  int8_t r = 0;  
  int len = strlen(str);  
  for(int i=0; i<len; i++){  
   //Check if this is a number  
   if ( str[i] < 0x3a && str[i] > 0x2f){  
     // is a ASCII number, return it  
     r = r * 10;  
   r += (str[i]-0x30);  
   }else{  
    i = len; //exit!  
    r = -1;  
    break;  
   }    
  }  
  return r;   
 }  
