#include <Servo.h>
#include <stdlib.h> 
#include <stdio.h>
#include <string.h>
#include "EmBencode.h"

// setup bencode
void EmBencode::PushChar (char ch) {
  Serial.write(ch);
}

char embuf [200];
EmBdecode decode (embuf, sizeof embuf);

//
char key[32]; // temporary key storage during bencode parsing

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
  Serial.begin(57600);
}

void loop(){
  // read key value pairs from serial input
  readSerial();
  
  boolean inputChanged = false;
  
  // sensor / analog read
  if(millis() - sendLastTime > sendSpeedLimit){
    int newSensorValue = analogRead(sensorPin);
    if(abs(newSensorValue - sensorValue) > sensorMinChange){
       sensorValue = newSensorValue;
       inputChanged = true;
    }
  }
 
  // button / digital input
  boolean newButtonState = digitalRead(buttonPin);
  if(buttonState != newButtonState){
    buttonState = newButtonState;
    inputChanged = true;
  }
  
  if(inputChanged){
    sendLastTime = millis();
    // send input data as bencode dictionary
    EmBencode encoder;
    encoder.startDict();
    encoder.push("analog");
    encoder.push(sensorValue);
    encoder.push("button");
    encoder.push(buttonState);
    encoder.endDict();
    Serial.println();
  }

/*
  // led / digital output
  if(led == 1){
    digitalWrite(ledPin, HIGH);
  } else {
    digitalWrite(ledPin, LOW);
  }
  
  // pwm output
  analogWrite(pwmPin,pwm);
  */
  
  //delay(100);
}

boolean expectingKey = false;

void readSerial(){
  if (Serial.available() > 0) {
    char ch = Serial.read();
    //Serial.write(ch);
    uint8_t bytes = decode.process(ch);
    if (bytes > 0) { // full bencode received
      for (;;) {
        uint8_t token = decode.nextToken();
        if (token == EmBdecode::T_END)
          break;
        switch (token) {
          case EmBdecode::T_STRING:
            //Serial.print(" string: ");
            if(expectingKey){
              readKey(decode.asString());
            }
            //Serial.println(decode.asString());
            expectingKey = !expectingKey;
            break;
          case EmBdecode::T_NUMBER:
            //Serial.print(" number: ");
            //Serial.println(decode.asNumber());
            readValue(decode.asNumber());
            expectingKey = !expectingKey;
            break;
          case EmBdecode::T_DICT:
            //Serial.println(" > dict");
            expectingKey = true;
            break;
          case EmBdecode::T_LIST:
            //Serial.println(" > list");
            break;
          case EmBdecode::T_POP:
            //Serial.println(" < pop");
            expectingKey = false;
            break;
        }
      }
      decode.reset();
    }
  }
  
}

void readKey(const char* _key){
  strcpy(key, _key);
}

// read string values
void readValue(const char* _value){
  
}

// read integer values
void readValue(const int _value){
  
  // if based switch statement, where the key is compared to predefined parameter strings with strcmp 
  if(strcmp(key,"led") == 0){ 
    led = _value; 
    // update led pin
    if(led == 0){
      digitalWrite(ledPin, LOW);
    } else {
      digitalWrite(ledPin, HIGH);
    }
    
    //Serial.print("led > ");
    //Serial.println(led,DEC);
    
  } else if(strcmp(key,"pwm") == 0){
    pwm = _value;
     // limit check
    if(pwm > 255)
      pwm = 255;
    else if(pwm < 0)
      pwm = 0; 
   // pwm output 
   analogWrite(pwmPin,pwm);
   
   //Serial.print("pwm > ");
   //Serial.println(pwm,DEC); 
   
  } else if(strcmp(key,"servo") == 0){
    servoValue = _value;
     // limit check
    if(servoValue > 180)
      servoValue = 180;
    else if(servoValue < 0)
      servoValue = 0;
    servo.write(servoValue);
    
    //Serial.print("servo > ");
    //Serial.println(servoValue,DEC);     
  }
}

