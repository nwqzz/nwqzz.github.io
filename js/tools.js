      // add timer Object make all statuses and methods object dependent
      
      let stop = '';
      let isReset = '';
      let numTimers = 2; // number of active timers

      function start(timer) {
        
        // display reset button and remove button
        let resetAndRemoveButtons = '<button onclick="reset('+ timer +')" class="resetButton"\'> reset </button>';
        resetAndRemoveButtons += '<button class="removeButton" onclick="removeButton('+(timer)+')">🗙</button>';
        document.getElementById('resetFrame'+timer).innerHTML =  resetAndRemoveButtons;

        // read the relevant input field
        let input = document.getElementById("timerInput"+timer).value;

        let timeSpan = parse(input); 
        let startTime = new Date();
        let endTime = new Date(startTime.getTime()+timeSpan) ;
        let timerEnded = false;

        let x = setInterval(function(){

          if(stop == timer){
            clearInterval(x);
          }
          if(isReset == timer){
            if(document.getElementById("timer"+timer).parentNode.className == 'timerSpan'){
              resetHtml = '<input type="text" id="timerInput'+timer+'" value="'+input+'"><button onclick="start('+timer+')"> start </button>'; 
            }else{
              resetHtml = '<input type="datetime-local" id="timerInput'+ timer +'"><button onclick="start('+timer+')"> start </button>';
            }
            resetHtml += '<button class="removeButton" onclick="removeButton('+(timer)+')">🗙</button>';
            document.getElementById("timer"+timer).innerHTML = resetHtml;
            document.getElementById("progressBar"+timer).classList.remove("flashing");
            document.getElementById("progressBar"+timer).style.width = 0;
            document.getElementById("resetFrame"+timer).innerHTML = '';
            stop = '';
            isReset = '';
            return;
          }

          let now = new Date();
          let countDown = endTime - now;

          if(countDown<0){
            if(!timerEnded){
              document.getElementById("progressBar"+timer).classList.add("flashing");
              beep();
              setTimeout(beep,500);
              setTimeout(beep,1000);
            }
            
            countDown *= -1;
            timerEnded = true;
          }

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
            document.getElementById("timer"+timer).innerHTML = 'Timer ended '+countDownText+' ago! ';
            return;
          }

          document.getElementById("timer"+timer).innerHTML = (countDownText);

          // calculate and set the  bar width
          let progressBarWidth = ((now.getTime() - startTime.getTime())/(timeSpan)*100).toFixed(2)*.99+ "%"
          document.getElementById("progressBar"+timer).style.width = progressBarWidth;
        
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
          
          let split = input.split(':');
          if(hasHours && !hasMinutes && hasSeconds){
            split[2]= split[1];
            split[1] = '00';
          }else{

          }
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

      // adds a new timer element below the last timer of its kind
      function addButton(spanOrEnd){ // The parameter spanOrEnd specifies whether the first (timespan) or second (endtime) add button was pressed

        let newTimer = ''
        
        let timerDiv = document.createElement("div");
        if(spanOrEnd == 1){
          timerDiv.classList.add("timerSpan");
        }else{
          timerDiv.classList.add("timerEnd");
        }

        newTimer += '<span id=timer'+(numTimers+1)+'>';
        if(spanOrEnd == 1){
          newTimer += '<input type="text" id="timerInput'+(numTimers+1)+'" value="1 minute 10 seconds">'  
        }else{
          newTimer += '<input type="datetime-local" id="timerInput'+(numTimers+1)+'">';
        
        }
        newTimer += '<button onclick="start('+(numTimers+1)+')"> start </button>';
        newTimer += '<button class="removeButton" onclick="removeButton('+(numTimers+1)+')">🗙</button>'
        newTimer += '</span>';
        newTimer += '<span id="resetFrame'+(numTimers+1)+'"></span>';
        newTimer += '<div class="progressBar" id="progressBar'+(numTimers+1)+'"></div>';
        newTimer += '</div>';

        timerDiv.innerHTML = newTimer;
        document.getElementById('addButton'+spanOrEnd).before(timerDiv);

        numTimers++;
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
        audio.volume = 0.3;
        audio.play();
      }
