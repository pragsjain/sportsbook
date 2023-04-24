import { Component } from '@angular/core';
import * as SockJS from 'sockjs-client';
import * as Stomp from 'stompjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'sports-book';
  sock = new SockJS('http://ec2-18-130-236-146.eu-west-2.compute.amazonaws.com:8080/sportsbook');
  stompClient = Stomp.over(this.sock);
  eventIdArray :any=[];
  eventDetailArray :any=[];
  marketDetailArray :any=[];
  eventMarketObj = {}
  eventMarketArray: any=[];

    ngOnInit() {
      this.connect();
    }

    private connect(): void {
      this.stompClient.connect({}, () => {
        console.log('Connected to SockJS server');
        this.subscribe();
      });
    }

    private subscribe(): void {
      this.stompClient.subscribe('/topic/inplay', (message) => {
        //console.log('Received message:', message, JSON.parse(message.body));
        this.eventIdArray =JSON.parse(message.body);
        this.eventIdArray.forEach((jsonObj: any) => {
          this.getEventMarketDetail(jsonObj['id']);
        });
      });

    }

    private getEventMarketDetail(id: any): void {
        let combinedData = {}
        const subscription1 = this.stompClient.subscribe(`/topic/event/${id}`, (message) => {
          //console.log('Received message event:', message, JSON.parse(message.body));
          let obj = JSON.parse(message.body)
          combinedData = {...combinedData, ...obj};

         const subscription2 = this.stompClient.subscribe(`/topic/market/${obj['marketId']}`, (message) => {
          //console.log('Received message market:', message, JSON.parse(message.body));
          let obj2 = JSON.parse(message.body);
          obj2['marketId']= obj2['id'];
          obj2['id']= id;
          combinedData = {...combinedData, ...obj2};
          console.log('combined',combinedData)
          //this.eventMarketArray.push(combinedData);

          if(this.eventMarketArray.length>0) {
            for (let i=0; i<5; i++) {
              if(this.eventMarketArray[i].id === id) {
                this.eventMarketArray.splice(i, 1, combinedData);
                return;
              }
              this.eventMarketArray.push(combinedData);
            }
          }
          else {
            this.eventMarketArray.push(combinedData);
          }
        });

      })

    }

    createConnection() {
      this.subscribe();
    }

    stopConnection() {
      this.stompClient.unsubscribe('/topic/inplay');
      this.stompClient.disconnect(() => {
        console.log('disconnected');
      });
    }


  ngOnDestroy() {
    this.stopConnection()
  }


}
