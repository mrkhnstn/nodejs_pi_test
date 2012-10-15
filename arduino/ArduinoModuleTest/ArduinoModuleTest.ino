#include <Servo.h>
#include <stdlib.h> 
#include <stdio.h>
#include <string.h>


char deviceId[] = "arduino"; 

// digital input fields
int buttonPin = 8;
int buttonState = 0;

// pwm fields
int pwmPin = 3;
int pwm = 0;

// digital output fields
int ledPin = 13;
int led = 0;

// analog read fields
int sensorPin = 0;
int sensorValue = 0;
int sensorMinChange = 20;
unsigned long sendLastTime = 0;
int sendSpeedLimit = 100;

// servo fields
Servo servo;
int servoPin = 5;
int servoValue = 0;

////////////////////////////////////////////////////////////////

void setup(){

  pinMode(ledPin,OUTPUT);
  pinMode(buttonPin,INPUT);
  pinMode(pwmPin,OUTPUT);
  servo.attach(servoPin);
  Serial.begin(9600);
}

void loop(){
  // read key value pairs from serial input
  readKeyValues();
  
  // sensor / analog read
  if(millis() - sendLastTime > sendSpeedLimit){
    int newSensorValue = analogRead(sensorPin);
    if(abs(newSensorValue - sensorValue) > sensorMinChange){
       sensorValue = newSensorValue;
       //Serial.print(deviceId);
       Serial.print("analog:");
       Serial.println(sensorValue,DEC);
       sendLastTime = millis();
    }
  }
 
  // button / digital input
  boolean newButtonState = digitalRead(buttonPin);
  if(buttonState != newButtonState){
    buttonState = newButtonState;
    //Serial.print(deviceId);
    Serial.print("button:");
    Serial.println(buttonState,DEC);
  }

  // led / digital output
  if(led == 1){
    digitalWrite(ledPin, HIGH);
  } else {
    digitalWrite(ledPin, LOW);
  }
  
  // pwm output
  analogWrite(pwmPin,pwm);
  
  //delay(100);
}

///////////////////////////////////////////////////////////
// KEY VALUE communication
//
// Usage: 
// 1. copy code below
// 2. overwrite processKeyValue() function
// 3. add Serial.begin(9600) or similar to setup()
// 4. add readKeyValues() to beginning of loop()


int readIndex = 0;
char key[255];
char value[255];

// reads key value pairs from serial
// if a key value pair is found then call processKeyValue()
void readKeyValues(){
   // try to read and parse incoming serial
  while(Serial.available() > 0){
    char c = Serial.read();
      if(c == ':'){
        // key value separator found
        // terminate buffer
        value[readIndex] = '\0';
        
        // copy buffer to key string
        strcpy(key,value);
        
        // reset read index for next token to be read
        readIndex = 0;
        
      } else if(c == '\r'){ 
        // cariage return found
        
        // terminate buffer
        value[readIndex] = '\0';
        // found value (now in value)

        // reset read index for next token to be read
        readIndex = 0;
    
        // process latest received key value
        processKeyValue();
        
      } else { 
        // no special character found
        // add read character to buffer
        value[readIndex] = c;
        readIndex++;
      }
  }
}

// processes key value pairs read from serial
void processKeyValue(){
  // access key-value-pair using key and value variables
  
  if(strcmp(key,"led") == 0){ // compare key agains "led"
    
    led = atoi(value); // convert value to integer
    Serial.print("led > ");
    Serial.println(led,DEC);
    
  } else if(strcmp(key,"pwm") == 0){ 
    
    pwm = atoi(value);
  
    // limit check
    if(pwm > 255)
      pwm = 255;
    else if(pwm < 0)
      pwm = 0;
      
    Serial.print("pwm > ");
    Serial.println(pwm,DEC);    
    
  } else if(strcmp(key,"servo") == 0){
    
    servoValue = atoi(value);
  
    // limit check
    if(servoValue > 180)
      servoValue = 180;
    else if(servoValue < 0)
      servoValue = 0;
    
    Serial.print("servo > ");
    Serial.println(servoValue,DEC);     
    servo.write(servoValue);
  }
}

// KEY VALUE communication
///////////////////////////////////////////////////////////
