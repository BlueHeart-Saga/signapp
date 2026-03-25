import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import "../style/TestimonialsAndCTA.css";

import BuiltForEveryoneSection from "./BuiltForEveryoneSection";
export default function TestimonialsAndCTA() {
  const [currentSlide, setCurrentSlide] = useState(0);
const navigate = useNavigate();


  const testimonials = [
  {
    name: "Emily Jeff",
    position: "CEO",
    company: "TheWebagency",
    image: "https://randomuser.me/api/portraits/women/1.jpg",
    quote: "Sign App transformed our HR onboarding offer letters; they are signed in minutes, saving huge time."
  },
  {
    name: "Hamza Malik",
    position: "Manager",
    company: "TheWorktech",
    image: "https://randomuser.me/api/portraits/men/2.jpg",
    quote: "For small business contracts, Sign App is simple, secure, and cost-effective — exactly what we needed."
  },
  {
    name: "Elizabeth Rai",
    position: "Developer",
    company: "i2c Company",
    image: "https://randomuser.me/api/portraits/women/3.jpg",
    quote: "Sales deals close faster with Sign App; CRM integration makes approvals and invoices effortless."
  },
  {
    name: "Rahul Verma",
    position: "HR Head",
    company: "SoftLine Pvt Ltd",
    image: "https://randomuser.me/api/portraits/men/4.jpg",
    quote: "Employee onboarding paperwork that took days now finishes within an hour with Sign App."
  },
  {
    name: "Sofia Martinez",
    position: "Legal Advisor",
    company: "LexCorp",
    image: "https://randomuser.me/api/portraits/women/5.jpg",
    quote: "e-signature compliance and audit trail features helped us stay legally protected."
  },
  {
    name: "David Johnson",
    position: "Sales Director",
    company: "BrightSales",
    image: "https://randomuser.me/api/portraits/men/6.jpg",
    quote: "Our sales team reduced deal-closing time by 60% using Sign App templates."
  },
  {
    name: "Meera Nair",
    position: "Operations Manager",
    company: "FinLogic",
    image: "https://randomuser.me/api/portraits/women/7.jpg",
    quote: "Tracking document status in real-time is a game changer for our workflows."
  },
  {
    name: "Adam Brown",
    position: "Entrepreneur",
    company: "StartupHub",
    image: "https://randomuser.me/api/portraits/men/8.jpg",
    quote: "We send partnership contracts globally without printing a single page now."
  },
  {
    name: "Priya Sharma",
    position: "Product Manager",
    company: "TechNest",
    image: "https://randomuser.me/api/portraits/women/9.jpg",
    quote: "UI is clean, intuitive, and onboarding team members took minutes."
  },
  {
    name: "Daniel Lee",
    position: "Consultant",
    company: "NextAdvisory",
    image: "https://randomuser.me/api/portraits/men/10.jpg",
    quote: "Secure signing and document encryption gives our clients complete confidence."
  },
  {
    name: "Anna Petrova",
    position: "Attorney",
    company: "Petrova Law",
    image: "https://randomuser.me/api/portraits/women/11.jpg",
    quote: "Court-compliant digital records make legal document handling stress-free."
  },
  {
    name: "James Carter",
    position: "CFO",
    company: "GreenBank",
    image: "https://randomuser.me/api/portraits/men/12.jpg",
    quote: "Sign App significantly reduced our approval bottlenecks in finance workflows."
  },
  {
    name: "Lina Chen",
    position: "Marketing Lead",
    company: "AdSpark",
    image: "https://randomuser.me/api/portraits/women/13.jpg",
    quote: "Vendor contract execution that took weeks now completes the same day."
  },
  {
    name: "Omar Khalid",
    position: "Director",
    company: "GlobalTrade LLC",
    image: "https://randomuser.me/api/portraits/men/14.jpg",
    quote: "Cross-border signatures became effortless for our international clients."
  },
  {
    name: "Julia Roberts",
    position: "HR Specialist",
    company: "PeopleFirst",
    image: "https://randomuser.me/api/portraits/women/15.jpg",
    quote: "Offer letters, NDAs, and agreements now move digitally — paper free office achieved."
  },
  {
    name: "Carlos Hernandez",
    position: "Logistics Manager",
    company: "ShipNow",
    image: "https://randomuser.me/api/portraits/men/16.jpg",
    quote: "Driver onboarding and compliance signatures are now fully automated."
  },
  {
    name: "Isabella Rossi",
    position: "Recruiter",
    company: "TalentStack",
    image: "https://randomuser.me/api/portraits/women/17.jpg",
    quote: "Candidates appreciate fast, remote signing without scanning or printing."
  },
  {
    name: "Michael Scott",
    position: "Regional Manager",
    company: "Dunder Mifflin",
    image: "https://randomuser.me/api/portraits/men/18.jpg",
    quote: "Our paper usage dropped drastically, saving cost and effort."
  },
  {
    name: "Fatima Noor",
    position: "Compliance Officer",
    company: "SecureDocs",
    image: "https://randomuser.me/api/portraits/women/19.jpg",
    quote: "GDPR and eIDAS compliance features were crucial in our selection."
  },
  {
    name: "Tom Wilson",
    position: "IT Lead",
    company: "NetCore",
    image: "https://randomuser.me/api/portraits/men/20.jpg",
    quote: "Integration with our CRM was smooth and very well-documented."
  },
  {
    name: "Arjun Patel",
    position: "Founder",
    company: "EduServe",
    image: "https://randomuser.me/api/portraits/men/21.jpg",
    quote: "Parent consent forms and academic agreements are now fully digital."
  },
  {
    name: "Nina Popov",
    position: "Project Manager",
    company: "BuildRight",
    image: "https://randomuser.me/api/portraits/women/22.jpg",
    quote: "Clients sign proposals instantly, accelerating project kickoff."
  },
  {
    name: "George Miller",
    position: "Broker",
    company: "Prime Realty",
    image: "https://randomuser.me/api/portraits/men/23.jpg",
    quote: "Property agreements and lease renewals are signed remotely with ease."
  },
  {
    name: "Harini Krishnan",
    position: "Doctor",
    company: "CarePlus Clinic",
    image: "https://randomuser.me/api/portraits/women/24.jpg",
    quote: "Patient consent forms are now digital and securely archived."
  },
  {
    name: "Lucas Martin",
    position: "Entrepreneur",
    company: "CloudStart",
    image: "https://randomuser.me/api/portraits/men/25.jpg",
    quote: "Best decision — contract signing is now a seamless experience for our clients."
  }
];

  const itemsPerPage = 3;
const totalPages = Math.ceil(testimonials.length / itemsPerPage);

  const nextSlide = () =>
  setCurrentSlide((prev) => (prev + 1) % totalPages);

const prevSlide = () =>
  setCurrentSlide((prev) => (prev - 1 + totalPages) % totalPages);


  return (
    <div className="tc-wrapper">
      {/* Testimonials */}
      {/* <section className="tc-testimonials">
        <div className="tc-container">
          <button className="tc-nav left" onClick={prevSlide}>
            <ChevronLeft />
          </button>

          <button className="tc-nav right" onClick={nextSlide}>
            <ChevronRight />
          </button>

          <div className="tc-slider">
            <div
              className="tc-track"
              style={{ transform: `translateX(-${currentSlide * (100 / itemsPerPage)}%)` }}

            >
              {testimonials.map((t, i) => (
                <div className="tc-slide" key={i}>
                  <div className="tc-card">
  <div className="tc-card-top">
    <img src={t.image} alt={t.name} className="avatar" />

    <div>
      <h3>{t.name}</h3>
      <p className="role">{t.position}</p>
      <p className="company">{t.company}</p>
    </div>
  </div>

  <p className="tc-quote">“{t.quote}”</p>
</div>

                </div>
              ))}
            </div>
          </div>

          <div className="tc-dots">
  {[...Array(totalPages)].map((_, i) => (

              <span
                key={i}
                className={`dot ${i === currentSlide ? "active" : ""}`}
                onClick={() => setCurrentSlide(i)}
              />
            ))}
          </div>
        </div>
      </section> */}

      <BuiltForEveryoneSection  />

      {/* CTA */}
      <section className="tc-cta">
        <div className="tc-cta-grid">
          <div className="tc-cta-image">
            <img
              src="/images/end.png"
              alt="Professional using tablet"
            />
            <div className="tc-diagonal" />
          </div>

          <div className="tc-cta-content">
            <h2>Simplify your contract workflow.</h2>
            <p>
              Trusted by businesses everywhere to manage contracts with ease.
            </p>
            <div className="tc-actions">
              <button className="primary" onClick={() => navigate("/login")}>Start Free Trial</button>
              <button className="secondary" onClick={() => navigate("/login")}>Contact Sales</button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
