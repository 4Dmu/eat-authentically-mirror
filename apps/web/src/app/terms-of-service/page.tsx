import Link from "next/link";
import { Separator } from "@/components/ui/separator";

export default function Page() {
  return (
    <div className="flex justify-center p-10">
      <div className="prose self-center">
        <h1>Terms of Service</h1>
        <p>
          <span className="font-bold">Effective Date:</span> 04-11-2025
        </p>
        <p>
          Welcome to <span className="font-bold">Eat Authentically</span>,
          operated by{" "}
          <span className="font-bold">Agencia LLC DBA Eat Authentically</span>
          (“Eat Authentically,” “we,” “us,” or “our”). By accessing or using our
          website, mobile site, or related services (collectively, the
          “Service”), you agree to these Terms of Service (“TOS”). If you do not
          agree, please do not use the Service.
        </p>
        <Separator />
        <div>
          <h2>1. Use of the Service</h2>
          <p>
            1.1 We grant you a non-exclusive, non-transferable, revocable
            license to access and use the Service in accordance with these TOS.
          </p>
          <p>
            1.2 You must be at least 18 years old (or the age of majority in
            your jurisdiction) and have the legal capacity to enter into this
            agreement.
          </p>
          <p>
            1.3 You agree to use the Service only for lawful purposes and in a
            manner consistent with these TOS and applicable law. You may not
            misuse the Service, attempt to interfere with its operation, or
            violate any rights of others.
          </p>
        </div>
        <Separator />
        <div>
          <h2>2. Producer Listings & Community Participation</h2>
          <p>
            {" "}
            2.1 Producers may{" "}
            <span className="font-bold">claim their listings for free</span> —
            always.
          </p>
          <p>
            2.2 Members and producers may participate in the community, share
            feedback, and help improve the platform.
          </p>
          <p>
            2.3 We may run contests, giveaways, or offer enhanced paid features
            such as annual subscriptions. Details and eligibility will be
            published separately.
          </p>
        </div>
        <Separator />
        <div>
          <h2>3. Subscriptions and Payments</h2>
          <p>
            3.1 Certain enhanced features (like premium listings or advanced
            analytics) are offered via paid subscriptions or promotional
            giveaways. Pricing, renewal, and cancellation terms will be shown at
            purchase.
          </p>
          <p>
            3.2 We may modify pricing, features, or promotions at our
            discretion.
          </p>
        </div>
        <Separator />
        <div>
          <h2>4. Intellectual Property</h2>
          <p>
            4.1 All content, design, logos, images, text, and software on the
            Service are owned by or licensed to Eat Authentically and are
            protected by U.S. and international intellectual-property laws.
          </p>
          <p>
            4.2 You may not reproduce, distribute, or create derivative works
            from our content without written permission.
          </p>
        </div>
        <Separator />
        <div>
          <h2>5. Disclaimers & Limitation of Liability</h2>
          <p>
            5.1 The Service is provided “as is” and “as available,” without any
            warranties, express or implied.
          </p>
          <p>
            5.2 We make no guarantees regarding the accuracy of listings,
            producer information, or availability of services.
          </p>
          <p>
            5.3 To the fullest extent permitted by law, our total liability to
            you for any claim arising out of your use of the Service will not
            exceed the greater of $100 USD or the amount you paid for the
            relevant feature in the past 12 months.
          </p>
          <p>
            5.4 We are not liable for any indirect, incidental, or consequential
            damages, including loss of data or profit.
          </p>
        </div>
        <Separator />
        <div>
          <h2>6. User Content and Feedback</h2>
          <p>
            6.1 You are responsible for all content you upload, post, or share
            (“User Content”). You represent that you own or have permission to
            share that content and that it does not violate any laws or rights.
          </p>
          <p>
            6.2 You grant us a worldwide, royalty-free, perpetual license to
            use, display, and adapt User Content for the purpose of operating
            and improving the Service.
          </p>
          <p>
            6.3 We may remove or moderate User Content that violates these TOS
            or is otherwise objectionable.
          </p>
        </div>
        <div>
          <h2>7. Communications & Opt-Out</h2>
          <p>
            7.1 By using the Service, you consent to receive communications from
            us, including account notices, updates, and promotional content.
          </p>
          <p>
            7.2 You may <span className="font-bold">opt out</span> of
            promotional emails at any time by clicking the “unsubscribe” link
            included in each email or by contacting us at [EMAIL ADDRESS].
          </p>
          <p>
            7.3 Even if you opt out of marketing, we may still send essential
            service or legal notifications.
          </p>
          <p>8. Privacy and Cookies</p>
          <p>
            Your privacy is important to us. Please review our{" "}
            <Link href={"/privacy-policy"} className="font-bold">
              Privacy Policy
            </Link>{" "}
            to understand how we collect, use, and protect your information.
          </p>
          <h2>9. Modifications to the Service or Terms</h2>
          <p>
            We may update, modify, or discontinue parts of the Service or these
            TOS at any time. Updates will be posted with a new “Effective Date.”
            Continued use of the Service after changes means you accept the
            revised Terms.
          </p>
        </div>
        <Separator />
        <div>
          <h2>10. Governing Law & Dispute Resolution</h2>
          <p>
            These Terms are governed by and construed in accordance with the
            laws of the <span className="font-bold">State of Wyoming, USA</span>
            , without regard to its conflict-of-law provisions. Any disputes
            arising from or related to these Terms shall be resolved in the
            state or federal courts located in{" "}
            <span className="font-bold">Sheridan County, Wyoming</span>, which
            shall have exclusive jurisdiction.
          </p>
          <h2>11. Contact Information</h2>
          <p>
            <span className="font-bold">Agencia LLC DBA Eat Authentically</span>{" "}
            30 N Gould St Ste N Sheridan, Wyoming 82801
            support@eatauthentically.app
          </p>
          <p>Last updated: 04-11-2025</p>
        </div>
      </div>
    </div>
  );
}
