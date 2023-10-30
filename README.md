# Payouts tracker

## About

This app is deployed online !

<a href="https://payouts-tracker-3ef536f81fa9.herokuapp.com/">Payouts tracker</a>

Payouts tracker is a modern application which can help track how much money you need to pay to your employees. 

It uses mongodb database to store the emplyoees data so you can forgive about unneccesary creating new excel files with the same employees, the app will do it for you!

## Mechanism

The payouts tracker application uses so called "campaigns" which duration is one month. You can choose the start of the campaign in the campaign creation.

In the campaign you can assign a days when the employees did their job.

Once the campaign is done you can export all stuff to the excel file (or not if you want).

## Technologies

- node.js
- express.js
- vanilla js
- ejs templates
- mongodb

There are also many third-party packages which creates this application.

## Security

The user credentials is safed with the bcrypt third-party package. 

Also, the app prevents the csrf attacks (more about it can be found here: <a href="https://developer.mozilla.org/en-US/docs/Glossary/CSRF">CSRF</a>)