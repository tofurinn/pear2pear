import studentPear from '../../assets/images/studentpfp.png'
import volunteerPear from '../../assets/images/volunteerpfp.png'
import GlobalNavbar from '../../assets/components/navbar/global-navbar'
import '../../global.css'
import './index.css'

function IndexPage() {
  return (
    <div className="index-page" id="home">
      <GlobalNavbar />

      <main>
        <section className="home-hero" aria-labelledby="home-title">
          <div className="home-hero__copy">
            <p className="home-hero__eyebrow">Good things grow together</p>
            <h1 className="page-title" id="home-title">
              A little help can go a long way.
            </h1>
            <p className="home-hero__description">
              Pear2Pear brings people together to learn, share, and support one
              another, one connection at a time.
            </p>
            <a className="home-hero__button" href="#join">
              Find your connection <span aria-hidden="true">&rarr;</span>
            </a>
          </div>

          <div className="home-hero__art" aria-label="Two Pear2Pear community members">
            <div className="home-hero__orbit home-hero__orbit--outer" />
            <div className="home-hero__orbit home-hero__orbit--inner" />
            <img
              className="home-hero__pear home-hero__pear--student"
              src={studentPear}
              alt="Student pear avatar"
            />
            <img
              className="home-hero__pear home-hero__pear--volunteer"
              src={volunteerPear}
              alt="Volunteer pear avatar"
            />
            <span className="home-hero__note">Better, together.</span>
          </div>
        </section>

        <section className="home-about" id="about" aria-labelledby="about-title">
          <p className="home-about__eyebrow">Pear2Pear</p>
          <h2 id="about-title">A community built on showing up for each other.</h2>
          <p>
            Whether you have a question or something to share, there is room to
            grow when we learn from one another.
          </p>
        </section>

        <section className="home-join" id="join" aria-labelledby="join-title">
          <div>
            <p className="home-join__eyebrow">Start where you are</p>
            <h2 id="join-title">Make your next connection count.</h2>
          </div>
          <a href="#about">Explore Pear2Pear <span aria-hidden="true">&rarr;</span></a>
        </section>
      </main>

      <footer className="home-footer">
        <span>pear2pear</span>
        <span>Growing better, together.</span>
      </footer>
    </div>
  )
}

export default IndexPage