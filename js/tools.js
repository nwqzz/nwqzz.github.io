      let stop = '';      // stores the id of the timer that is beeing stopped
      let isReset = '';   // stores the id of the timer that is beeing reset
      let numTimers = 0;  // stores the number of timer ids that are used up

      window.onload = init;
      
      function init() {
        createTimer(-1,1,-1);
        createTimer(-1,2,-1);
      }

      function start(timer) {
        
        // generate reset button 
        let resetButton = document.createElement('button');
        resetButton.innerHTML = 'reset';
        resetButton.classList.add('resetButton');
        resetButton.setAttribute('onclick','reset('+timer+')');        
        document.getElementById('resetFrame'+timer).appendChild(resetButton);

        // read the relevant input field
        let input = document.getElementById('timerInput'+timer).value;

        let timeSpan = parse(input); 
        let startTime = new Date();
        let endTime = new Date(startTime.getTime()+timeSpan) ;
        let timerEnded = false;


        let x = setInterval(function(){

          // stop the interval function if a given timer is stopped
          if(stop == timer){
            clearInterval(x);
          }


          // reset the timer if the isReset variable is set to reset that timer
          if(isReset == timer && document.getElementById('timer'+timer)){
            
            // copy a new timer over the old one
            createTimer(timer,-1,input);

            
            // clear stop and reset variables and exit the inteval function
            stop = '';
            isReset = '';
            return;
          }

          let now = new Date();
          let countDown = endTime - now;

          // animate the progressbar and play an alarm tone when the timer has finished
          if(countDown<0){
            if(!timerEnded){
              document.getElementById('progressBar'+timer).classList.add('flashing');
              beep();
              setTimeout(beep,500);
              setTimeout(beep,1000);
            }
            
            // change countDown to time since the timer has ended in millis
            countDown *= -1;
            timerEnded = true;
          }

          // compute seconds minutes hours and days from millis in countDown variable
          let seconds = Math.floor((countDown % (1000 * 60)) / 1000);
          let minutes = Math.floor((countDown % (1000 * 60 * 60)) / (1000 * 60));
          let hours = Math.floor((countDown % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          let days = Math.floor(countDown / (1000 * 60 * 60 * 24));

          let countDownText = '';
          // check and only output days hours and minutes if applicable
          if(days){
            countDownText += days + ' days ';
            countDownText += hours + ' hours ';
            countDownText += minutes + ' minutes ';
          }else{
            if(hours){
            countDownText += hours + ' hours ';
            countDownText += minutes + ' minutes ';
            }else{
              if(minutes){
                countDownText += minutes + ' minutes ';
              }
            }
          }
          countDownText += seconds + ' seconds ';

          // changed output if timer has run out
          if(timerEnded){
            document.getElementById('timer'+timer).innerHTML = 'Timer ended '+countDownText+' ago! ';
            return;
          }

          
          document.getElementById('timer'+timer).innerHTML = countDownText;

          // calculate and set the  bar width
          let progressBarWidth = ((now.getTime() - startTime.getTime())/(timeSpan)*100).toFixed(2)*.99+ '%'
          document.getElementById('progressBar'+timer).style.width = progressBarWidth;
        
        }, 10);
      }

      // converts text from the input field into a timespan, using regex
      function parse(input){
        
        // check if input is in default format (from date picker)
        if(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(input)){
          // return distance between chosen time and now in milliseconds
          return new Date(input) - new Date();
        }

        // remove all whitespace
        input = input.replace(/\s/g,'');

        // test if input only contains numbers
        if(/^\d+$/.test(input)){

          //interpret input as minutes
          return input * 60000;
        }
        
        let until = false;  // specifies whether the timer runs until a specified time (true) or for a specified timespan (false)
        
        // check for keywords that imply a specified endtime
        let keyWords = ['at', 'until', 'um', 'bis', 'am', 'pm', 'Uhr', 'uhr'];
        keyWords.forEach(element => {
          if(input.startsWith(element)||input.endsWith(element)){
            until = true;
          }
        });

        let pm = false; // pm specifies whether the time is in the afternoon, i.e. +12 hours
        if(input.endsWith('pm')){
            pm = true;
        }
        
        keyWords.forEach(element => {
          input = input.replace(element, '');
        });

        // test if input format is '(hh:)mm:ss'
        if(/^(\d+:)?(\d{1,2}:)?\d{1,2}$/.test(input)){
          
          let split = input.split(':');

          // treat the entered string as an endtime and calculate the timespan from now to then
          if(until){
            
            // filling in seconds value with 0 if it is not set
            if(!split[2]){
              split[2] = 0;
            }
            if(!split[1]){
              split[1] = 0;
            }

            let timeOfDay = convertTimespan(split); // the number of milliseconds between the entered time and 00:00 am

            let todaysDate = new Date();            // the time and date at 00:00 am today
            todaysDate.setHours(0,0,0,0);
            
            let endTime = new Date();               // a Date object with todays date and the time from the input field 
            endTime.setTime(todaysDate.getTime()+timeOfDay);
            
            // add 12 hours is the time is 'pm'
            if(pm){
              endTime.setHours(endTime.getHours()+12);
            }
            
            // if the time entered is already in the past, adjust endtime to the following day
            if(endTime - new Date()<0){
              endTime.setDate(endTime.getDate()+1)
            }
            
            // return the distance between the specified end time and now
            return endTime - new Date();
          }

          return convertTimespan(split);
        }

        // test if input is formated with hours, minutes, seconds, h, m, s or equivalent
        //    (h  hours          mm     minutes             ss     seconds)
        if(/^(\d+(h|hour(s)?))?(\d{1,2}(m|min|minute(s)?))?(\d{1,2}(s|sec|second(s)?))?$/.test(input)){
          
          split = parseWordInput(input);
          return convertTimespan(split);
        }
      }

      // takes string input in the form of hh hours mm minutes ss seconds
      function parseWordInput(input){

          //the following code checks whether hours minutes or seconds are used and prepares the split array for timespan conversion
          let hasHours = false;
          let hasMinutes = false;
          let hasSeconds = false;

          // check if hours minutes and seconds are part of the input and replace them with ':'
          if(/(h|hour(s)?)/.test(input)){
            hasHours = true;
            input = input.replace(/(hour(s)?|h)/,':');
          }

          if(/(m|min|minute(s)?)/.test(input)){
            hasMinutes = true;
            input = input.replace(/(minute(s)?|min|m)/,':');
          }
          
          if(/(s|sec|second(s)?)/.test(input)){
            hasSeconds = true;
            input = input.replace(/(second(s)?|sec|s)/,'');
          }
          
          // separate the seconds minutes and hours of the string into separate array values
          let split = input.split(':');
          // fill in '00' minutes if they are missing
          if(hasHours && !hasMinutes && hasSeconds){
            split[2]= split[1];
            split[1] = '00';
          }
          // fill in '00' seconds if they are missing
          if(!hasSeconds){
            split[2] = 00;
          }

          return split;
      }

      // receives an array containing (hours) (minutes) seconds; return timespan in milliseconds
      function convertTimespan(split){
        
        split.reverse();
        
        let secs = Number(split[0]);
        
        let mins = 0;
        if(split[1]){
          mins = Number(split[1]);
        }
        let hours = 0;
        if(split[2]){
          hours = Number(split[2]);
        }
        
        return (hours * 3600 + mins*60 + secs) * 1000;

      }

      // resets the timer with the given number
      function reset(timer){
        stop = timer;
        isReset = timer;
      }

      // adds a new timer element below the last timer of its kind //TODO replace this method
      function addButton(inputType){ // The parameter spanOrEnd specifies whether the first (timespan) or second (endtime) add button was pressed

        createTimer(-1,inputType,-1);
        return;
      }

      /* creates a new timer or writes over an existing timer
       *
       * timer: specifies which timer to write over; -1 means a new timer is created
       * inputType: specefies wether text or picker input is used (can be set to -1 if an existing timer is specified)
       * input: default input value in case of a text input (can be set to -1 if not used)
       *  
       */
      function createTimer(timer, inputType, input){

        let timerContainer = document.createElement('div');

        // if timer is -1 then a new timer container with timer, reset frame and progressbar is created
        if(timer<0){
          if(inputType == 1){
            timerContainer.classList.add('textInput');
            input = '1 minute 10 seconds';
            let addButtonNode = document.getElementById('addButton1');
            addButtonNode.parentNode.insertBefore(timerContainer,addButtonNode);
          }else{
            timerContainer.classList.add('pickerInput');
            let addButtonNode = document.getElementById('addButton2');
            addButtonNode.parentNode.insertBefore(timerContainer,addButtonNode);
          }
          timer = numTimers+1;
          numTimers++;

          let titleDiv = document.createElement('div');
          titleDiv.classList.add('title');
          let titleText = document.createElement('p');
          titleText.innerHTML = 'click to enter a title';
          titleText.setAttribute('contenteditable', 'true');
          titleDiv.appendChild(titleText);
          timerContainer.appendChild(titleDiv);

          let timerSpan = document.createElement('span');
          timerSpan.setAttribute('id', 'timer'+(timer));
          timerContainer.appendChild(timerSpan);

          let resetFrame = document.createElement('span');
          resetFrame.setAttribute('id', 'resetFrame'+(timer));
          timerContainer.appendChild(resetFrame);

          let progressBar = document.createElement('div');
          progressBar.setAttribute('id', 'progressBar'+(timer));
          progressBar.classList.add('progressBar');
          timerContainer.appendChild(progressBar);

          

        }

        // generate a remove Button
        let resetRemoveButton = document.createElement('button');
        resetRemoveButton.innerHTML = '🗙';
        resetRemoveButton.classList.add('removeButton');
        resetRemoveButton.setAttribute('onclick', 'removeButton('+timer+')');
        timerContainer.appendChild(resetRemoveButton);

        timerSpan = document.getElementById('timer'+timer);
        
        timerSpan.innerHTML = '';
        document.getElementById('resetFrame'+timer).innerHTML = ''
        
        let resetInput = document.createElement('input');
        resetInput.id = 'timerInput'+timer;

        // reset input field in case of a time span timer
        if(document.getElementById('timer'+timer).parentNode.className == 'textInput'){
        
          resetInput.setAttribute('type', 'text');
          resetInput.setAttribute('value', input);
        
         // reset the input field in case of a time an date picker
        }else{
          resetInput.setAttribute('type', 'datetime-local');
        }

        timerSpan.appendChild(resetInput);

        // generate a start Button
        let resetStartButton = document.createElement('button');
        resetStartButton.innerHTML = 'start';
        resetStartButton.setAttribute('onclick', 'start('+timer+')');
        timerSpan.appendChild(resetStartButton);
        
        // reset progressbar and remove reset button
        document.getElementById('progressBar'+timer).classList.remove('flashing');
        document.getElementById('progressBar'+timer).style.width = 0;
        document.getElementById('resetFrame'+timer).innerHTML = '';
 
      }

      // removes the timer with the specified number 
      function removeButton(timer){
        reset(timer);
        let timerDiv = document.getElementById('timer'+timer).parentNode;
        timerDiv.remove();
      }

      // plays a short beeping noise
      function beep(){
        let audio = new Audio('beep.wav');
        audio.volume = 0.2;
        audio.play();
      }
