import {  useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import headerLogo from '../components/header-logo.png';
import axios from 'axios';
import FormData from 'form-data';

// Is it safe to have the auth token on the front end?  
const AdminDashboard = () => {
    const [notifications, setNotifications] = useState([]);
    const [paymentIds, setPaymentIds] = useState([]);

    const [purchase, setPurchase] = useState('');
    const [amount, setAmount] = useState(0);
    const [currency, setCurrency] = useState('aud');

    useEffect(() => {
        const token = localStorage.getItem('token');


        const token_form = new FormData();
        token_form.append('token', token)

        axios.post('https://osbornai.herokuapp.com/admin/view_inquiry_notifications', token_form)
        .then((res) => {
            const form = res.data;

            const inquiries = form.inquiries;
            setNotifications(inquiries);
        })
        .catch((err) => {
            window.location.reload();
        });

        axios.post('https://osbornai.herokuapp.com/admin/view_valid_payment_ids', token_form)
        .then((res) => {
            const form = res.data;

            const payment_ids = form.payment_ids;
            setPaymentIds(payment_ids);
        })
        .catch((err) => {
            window.location.reload();
        });
        

    }, []);

    const deleteNotification = (e, id) => {
        e.preventDefault();

        const token = localStorage.getItem('token');

        const delete_form = new FormData();
        delete_form.append('token', token);
        delete_form.append('inquiry_notification_id', id);

        axios.post('https://osbornai.herokuapp.com/admin/delete_inquiry_notification', delete_form)
        .then((res) => {
            // We are going to filter out the ID that has this
            const new_notifications = notifications.filter((notification) => {return notification._id !== id});
            setNotifications(new_notifications);
        })
        .catch((err) => {
            console.log(err.response.data);
        });
    };

    const displayInquiryNotifications = () => {
        // Operations: View, Delete
        return (
            <>
                <h4 class="center">New Inquiries</h4> 
                {notifications.length === 0 ? 
                    <li>
                        <br />
                        <h5 class="center">There are no new inquiries!</h5>
                        <br />
                        <br />
                        <br />
                        <br />
                        <br />
                        <br />
                        <br />
                        <br />
                        <br />
                    </li>
                    :notifications.map((notification) => {
                        return (
                            <li key={notification._id}>
                                <div class="card">
                                    <div class="card-content">
                                        <div className="Name">
                                            <b>Name:</b> {notification.first} {notification.last}
                                        </div>
                                        <div className="Email">
                                            <b>Email:</b> {notification.email}
                                        </div>
                                        <div className="NewInquiry">
                                            {/* Maybe I want to convert UTC to Australian time */}
                                            {/* I need better formatting of this date */}
                                            <b>Inquiry date:</b> {notification.new_inquiry.inquiry_date} 
                                            <br />
                                            <b>Inquiry:</b> 
                                            <br />
                                            {notification.new_inquiry.inquiry}
                                        </div>
                                        {/* Make this conditinal if there are previous inquiries */}
                                        <div className="PreviousInquiries">
                                            <b>Previous inquiries:</b>
                                            <br />
                                            <ul>
                                                {notification.previous_inquiries.slice(0, 3).map((prev_inquiry) => {
                                                    return (
                                                        <li id={Math.random().toString(36).substring(7)}>
                                                            <div className="PreviousInquiryDate">
                                                                <b>Previous inquiry date:</b> {prev_inquiry.inquiry_date}
                                                                <br />
                                                                <b>Inquiry: </b>
                                                                <br />
                                                                <b>Previous inquiry</b> 
                                                                <br />
                                                                {prev_inquiry.inquiry}
                                                            </div>
                                                        </li>
                                                    );
                                                })}
                                            </ul>
                                        </div>
                                        <div className="UserSpendings">
                                            <b>Total spent:</b> ${notification.user_spent}
                                        </div>
                                    </div>
                                    <div class="card-action center">
                                        <button class="btn blue darken-1 waves-effect waves-light" onClick={(e) => {deleteNotification(e, notification._id)}}>
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </li>
                        );
                    })
                }
            </>
        );
    };

    const newPaymentId = (e) => {
        e.preventDefault();

        const token = localStorage.getItem('token');

        const payment_form = new FormData();
        payment_form.append('token', token);
        payment_form.append('purchase', purchase);
        payment_form.append('amount', amount);
        payment_form.append('currency', currency);

        axios.post('https://osbornai.herokuapp.com/admin/create_payment_id', payment_form)
        .then((res) => {
            const form = res.data;

            setPaymentIds([form].concat(paymentIds));

            e.target.reset();
        })
        .catch((err) => {
            // I need to have better error messages for the response codes
            console.log(err.response.data);
            window.location.reload();
        });
    };

    const displayPaymentIds = () => {
        return (
            <>
                <h4 class="center">Create a new payment ID</h4>
                <form onSubmit={newPaymentId} id="sendForm">
                    <div class="input-field">
                        <textarea class="materialize-textarea" id="purchase" placeholder="Purchase" name="purchase" required={true} onChange={(e) => {setPurchase(e.target.value)}} />
                        <input type="number" min={0} placeholder="Amount" name="amount" required={true} onChange={(e) => {setAmount(e.target.value)}} />
                        <select class="browser-default" name="currency" onChange={(e) => {setCurrency(e.target.value)}}>
                            <option value="aud">AUD</option>
                            <option value="usd">USD</option>
                        </select>
                    </div>
                </form>
                <button class="btn blue darken-1 waves-effect waves-light" type="submit" form="sendForm">
                    Send
                    <i class="material-icons right">send</i>
                </button>
                <h4 class="center">Payment ID's</h4>
                {paymentIds.length === 0 ? 
                <li>
                    <br />
                    <h5 class="center">There are no current payment ID's!</h5>
                    <br />
                    <br />
                    <br />
                    <br />
                    <br />
                    <br />
                    <br />
                    <br />
                    <br />
                </li>
                :paymentIds.map((payment_id) => {
                    return (
                        <li key={payment_id._id}>
                            <div class="card">
                                <div class="card-content">
                                    <b>Payment ID:</b> {payment_id._id}
                                    <br />
                                    <b>Purchase:</b> {payment_id.purchase}
                                    <br />
                                    <b>Amount:</b> {payment_id.amount}
                                    <br />
                                    <b>Currency:</b> {payment_id.currency}
                                    <br />
                                    <b>Expires in:</b> {parseInt((new Date(payment_id.expiry) - new Date().getTime()) / 8.64e7) + 1}
                                </div>
                            </div>
                        </li>
                    );
                })
                }
            </>
        );
    };

    return (
        <div className="Header">
            <div className="Top" />
            <header>
                <div class="navbar-fixed">
                    <nav>
                        <div class="nav-wrapper blue darken-1 center">
                            <Link class="brand-logo center" href="/" to="/" smooth={true} duration={400} style={{fontSize: 34}}>
                                <div class="valign-wrapper row">
                                    <div class="col valign-wrapper">
                                        <img class="center" src={headerLogo} alt="OsbornAI logo" width="42" height="42"/>
                                    </div>
                                    <div class="col valign-wrapper">
                                        OSBORNAI
                                    </div>
                                </div>
                            </Link>
                        </div>
                    </nav>
                </div>
            </header>
            <div class="container">
                <br />
                <br />
                <br />
                <br />
                <br />
                <br />
                <br />
                <div class="row">
                    <div class="col s12 m12 l6">
                        <ul class="container">
                            {displayInquiryNotifications()}
                        </ul>
                    </div>
                    <div class="col s12 m12 l6">
                        <ul class="container">
                            {displayPaymentIds()}
                        </ul>
                    </div>
                </div>
                <br />
                <br />
                <br />
                <br />
                <br />
                <br />
                <br />
                <br />
                <br />
                <br />
                <br />
            </div>
        </div>
    );
};

export default AdminDashboard;