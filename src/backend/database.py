from pymongo import MongoClient
from datetime import datetime, timedelta
import dotenv
import os
import hashlib
from bson import ObjectId
import traceback

class ErrorCodes:
    error_code_token = 24
    error_code_failed = 25
    error_code_other = 26

class Database:
    def __init__(self):
        dotenv.load_dotenv()

        mongo_username = os.getenv('MONGO_USERNAME')
        mongo_password = os.getenv('MONGO_PASSWORD')

        mongo_url = f"mongodb+srv://{mongo_username}:{mongo_password}@cluster-main.lh2ft.mongodb.net/main?retryWrites=true&w=majority"
        cluster = MongoClient(mongo_url)

        main = cluster['main']

        self.clients = main['clients']
        self.payments = main['payments']
        self.client_notifications = main['client_notifications']
        self.admin_auth = main['admin_auth']
        self.payment_ids = main['payment_ids']
        
        self.expires_in = 86400 * 7
        self.payment_ids.create_index("timeCreated", expireAfterSeconds=self.expires_in)

    def add_inquiry(self, first, last, email, inquiry):
        try:
            date = datetime.utcnow()

            prev_inquiries = list(self.clients.find({'email': email}))

            prev_inquiries_sorted = sorted([prev_inquiry['inquiry_date'] for prev_inquiry in prev_inquiries])
            if len(prev_inquiries_sorted) != 0:
                closest_prev_inquiry = prev_inquiries_sorted[-1]
                if (date - closest_prev_inquiry).days < 10:
                    return {'success': False, 'error_code': ErrorCodes.error_code_failed, 
                            'error': "Inquiry has already been made by the user within 10 days!", 'prev_inquiry_date': closest_prev_inquiry}

            client_document = {
                'first': first,
                'last': last,
                'email': email,
                'inquiry': inquiry,
                'inquiry_date': date
            }

            self.clients.insert_one(client_document)

            prev_user_spendings = list(self.payments.find({'stripe_token.email': email}))
            user_spent = sum(payment['payment_id_details']['amount'] for payment in prev_user_spendings)

            client_notification_document = {
                'first': first,
                'last': last,
                'email': email,
                'inquiry': inquiry,
                'inquiry_date': date,
                'prev_inquiries': list(prev_inquiries)[::-1],
                'user_spent': user_spent
            }

            self.client_notifications.insert_one(client_notification_document)

            return {'success': True, 'prev_inquiry_date': date}

        except:
            err = traceback.format_exc()
            print(err)
            return {'success': False, 'error_code': ErrorCodes.error_code_other, 'error': err, 'prev_inquiry_date': None}

    def add_payment(self, payment_id_details, stripe_token, charge, customer):
        try:
            document = {'payment_id_details': payment_id_details, 'stripe_token': stripe_token, 'charge': charge, 'customer': customer}

            self.payments.insert_one(document)

            return {'success': True} 
        
        except:
            err = traceback.format_exc()
            print(err)
            return {'success': False, 'error_code': ErrorCodes.error_code_other, 'error': err}

    def admin_view_payments(self):
        try:
            payments = list(self.payments.find())[::-1]

            return {'success': True, 'payments': payments}

        except:
            err = traceback.format_exc()
            print(err)
            return {'success': False, 'payments': None, 'error_code': ErrorCodes.error_code_other, 'error': err}

    def admin_view_inquiry_notifications(self):
        try:
            new_inquiries = list(self.client_notifications.find())[::-1]

            return {'success': True, 'inquiry_notifications': new_inquiries}
        
        except:
            err = traceback.format_exc()
            print(err)
            return {'success': False, 'inquiry_notifications': None, 'error_code': ErrorCodes.error_code_other, 'error': err}

    def admin_delete_inquiry_notification(self, inquiry_notification_id):
        try:
            self.client_notifications.delete_one({'_id': ObjectId(inquiry_notification_id)})

            return {'success': True}
        
        except:
            err = traceback.format_exc()
            print(err)
            return {'success': False, 'error_code': ErrorCodes.error_code_other, 'error': err}

    def admin_create_payment_id(self, identifier, purchase, amount, currency_raw):
        try:
            currency = currency_raw.lower()

            valid_currencies = ['aud', 'usd']
            if currency not in valid_currencies:
                return {'success': False, 'error_code': ErrorCodes.error_code_failed, 'error': "Not a valid currency!"}
            
            if float(amount) < 1:
                return {'success': False, 'payment_details': None, 'error_code': ErrorCodes.error_code_failed, 'error': "Amount must be greater than or equal to $1!"}

            document = {'name': "OsbornAI Payment", 'identifier': identifier, 'purchase': purchase, 
                        'amount': round(float(amount), 2), 'currency': currency, 'timeCreated': datetime.utcnow(), 
                        'expiry': datetime.utcnow() + timedelta(seconds=self.expires_in)}
            payment_id = self.payment_ids.insert_one(document)

            payment_details = {**{'_id': payment_id.inserted_id}, **document}

            return {'success': True, 'payment_details': payment_details}

        except:
            err = traceback.format_exc()
            print(err)
            return {'success': False, 'payment_details': None, 'error_code': ErrorCodes.error_code_other, 'error': err}

    def admin_delete_payment_id(self, payment_id):
        try:
            self.payment_ids.delete_one({'_id': ObjectId(payment_id)})

            return {'success': True}
        
        except:
            err = traceback.format_exc()
            print(err)
            return {'success': False, 'error_code': ErrorCodes.error_code_other, 'error': err}

    def admin_view_payment_ids(self):
        try:
            payment_ids = list(self.payment_ids.find())[::-1]

            return {'success': True, 'payment_ids': payment_ids}
        
        except:
            err = traceback.format_exc()
            print(err)
            return {'success': False, 'payment_ids': None, 'error_code': ErrorCodes.error_code_other, 'error': err}

    def admin_view_payment_id_details(self, payment_id):
        try:
            payment_id_info = self.payment_ids.find_one({'_id': ObjectId(payment_id)})
            if payment_id_info == None:
                return {'success': False, 'payment_id_info': None, 'error_code': ErrorCodes.error_code_failed, 'error': 'Invalid payment ID!'}

            return {'success': True, 'payment_id_info': payment_id_info}
        
        except:
            err = traceback.format_exc()
            print(err)
            return {'success': False, 'payment_id_info': None, 'error_code': ErrorCodes.error_code_other, 'error': err}

    def admin_login(self, username, password):
        try:
            salt = "oTaLtzyE2SvGIzGXnDqmGzdBpz0DP3xQROY0W5t4sKdTdX5PIg"
            user_info = self.admin_auth.find_one({'username': username})

            if user_info == None:
                return {'success': False, 'error_code': ErrorCodes.error_code_failed, 'error': "Authentication failed!"} 
            
            hashed_password = hashlib.sha512((password+salt).encode('utf-8')).hexdigest()
            if hashed_password == user_info['password']:
                return {'success': True}
            
            return {'success': False, 'error_code': ErrorCodes.error_code_failed, 'error': "Authentication failed!"}

        except:
            err = traceback.format_exc()
            print(err)
            return {'success': False, 'error_code': ErrorCodes.error_code_other, 'error': err}