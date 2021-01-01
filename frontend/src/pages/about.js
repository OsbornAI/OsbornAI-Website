const About = () => {
    const aboutHookStyle = {
        fontSize: 23
    };

    const aboutFollowStyle = {
        fontSize: 18
    };

    return (
        <div className="About">
            <br />
            <br />
            <br />

            <div class="row center valign-wrapper hide-on-med-and-down">
                <div class="col s12 m12 l6">
                    <img class="responsive-img center" alt="Black and Gray Mining Rig"
                    src="https://images.pexels.com/photos/1148820/pexels-photo-1148820.jpeg?auto=compress&cs=tinysrgb&h=750&w=1260" width="562.5" height="375"/>
                </div>
                <div class="col s12 m12 l6">
                    <p style={aboutHookStyle}>
                        <p>
                            Data can be confusing, but it’s also essential to the success of your business. 
                        </p>
                        <p>
                            Whether you’re a large company or a small business, correct usage of data will allow you to scale your 
                            business to new heights and increase your revenue.
                        </p>
                    </p>
                </div>
            </div>
            <div class="row center hide-on-large-only">
                <div class="col s12 m12 l12">
                    <img class="responsive-img center" alt="Black and Gray Mining Rig"
                    src="https://images.pexels.com/photos/1148820/pexels-photo-1148820.jpeg?auto=compress&cs=tinysrgb&h=750&w=1260" width="562.5" height="375"/>
                </div>
                <div class="col s12 m12 l12">
                    <p style={aboutHookStyle}>
                        <p>
                            Data can be confusing, but it’s also essential to the success of your business. 
                        </p>
                        <p>
                            Whether you’re a large company or a small business, correct usage of data will allow you to scale your 
                            business to new heights and increase your revenue.
                        </p>
                    </p>
                </div>
            </div>

            <p style={aboutFollowStyle}>
                Here at OsbornAI, we understand the importance of data, so we make it our mission 
                to help you use data in the most effective way for your business, so you can make 
                smarter business decisions and tackle complex problems within your business. 
            </p>
        </div>
    );
};

export default About;