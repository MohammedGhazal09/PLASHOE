import React, { useState, useRef } from "react";

const Accordion = () => {
  const [activeIndex, setActiveIndex] = useState(null);
  const contentRefs = useRef([]);

  const toggleAccordion = (index) => {
    if (activeIndex === index) {
      setActiveIndex(null); // Close the active accordion if clicked again
    } else {
      setActiveIndex(index); // Open the clicked accordion
    }
  };

  const getMaxHeight = (index) => {
    if (activeIndex === index && contentRefs.current[index]) {
      return `${contentRefs.current[index].scrollHeight}px`;
    }
    return "0px";
  };

  const accordionItems = [
    {
      title: "Quam ligula tristique sed leo nunc aenean amet",
      content:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut elit tellus, luctus nec ullamcorper mattis, pulvinar dapibus leo.",
    },
    {
      title: "Tortor eget a a tincidunt est viverra turpis",
      content:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut elit tellus, luctus nec ullamcorper mattis, pulvinar dapibus leo.",
    },
    {
      title: "Quis cras urna diam id nec amet",
      content:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut elit tellus, luctus nec ullamcorper mattis, pulvinar dapibus leo.",
    },
    {
      title: "Id congue bibendum velit blandit massa elementum",
      content:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut elit tellus, luctus nec ullamcorper mattis, pulvinar dapibus leo.",
    }
  ];

  return (
    <div id="accordion-collapse">
      {accordionItems.map((item, index) => (
        <div key={index}>
          <h2>
            <button
              type="button"
              className={`flex items-center justify-between w-full p-5 font-medium text-gray-500 border ${
                index === 0 ? "rounded-t-xl" : ""
              } border-gray-200  dark:focus:ring-gray-800 dark:border-gray-700 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 gap-3 transition duration-300`}
              onClick={() => toggleAccordion(index)}
            >
              <span>{item.title}</span>
              <svg
                className={`w-3 h-3 transition-transform duration-300 ${
                  activeIndex === index ? "rotate-180" : ""
                }`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 10 6"
              >
                <path
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 5 5 1 1 5"
                />
              </svg>
            </button>
          </h2>
          <div
            ref={(el) => (contentRefs.current[index] = el)}
            className={`overflow-hidden transition-[max-height] duration-300 ease-in-out`}
            style={{
              maxHeight: getMaxHeight(index),
            }}
          >
            <div className="p-5 border border-b-0 border-gray-200 dark:border-gray-700 dark:bg-gray-900">
              <p className="mb-2 text-gray-500 dark:text-gray-400">
                {item.content}
              </p>
              {item.linkText && (
                <p className="text-gray-500 dark:text-gray-400">
                  Check out this guide to{" "}
                  <a
                    href={item.linkHref}
                    className="text-blue-600 dark:text-blue-500 hover:underline"
                  >
                    {item.linkText}
                  </a>
                  .
                </p>
              )}
              {item.links && (
                <ul className="ps-5 text-gray-500 list-disc dark:text-gray-400">
                  {item.links.map((link, i) => (
                    <li key={i}>
                      <a
                        href={link.href}
                        className="text-blue-600 dark:text-blue-500 hover:underline"
                      >
                        {link.text}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Accordion;
