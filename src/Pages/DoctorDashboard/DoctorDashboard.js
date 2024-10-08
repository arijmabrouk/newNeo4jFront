import React, { useContext, useEffect, useState } from "react";
import {
  ArrowLeftOutlined,
  BarChartOutlined,
  CalendarOutlined,
  EnvironmentOutlined,
  FileExcelOutlined,
  FileImageOutlined,
  FilePdfOutlined,
  FileTextOutlined,
  LineChartOutlined,
  LogoutOutlined,
  MedicineBoxOutlined,
  PieChartOutlined,
  PLusCircleOutlined,
  SearchOutlined,
  TeamOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  Avatar,
  Breadcrumb,
  Button,
  Col,
  ConfigProvider,
  DatePicker,
  Input,
  Layout,
  Menu,
  Row,
  theme,
} from "antd";
// import Header from "../../components/Header/Header";
import GlobalContext from "../../context/GlobalContext";
// import UpdateProfile from "./UpdateProfile/UpdateProfile";
// import UploadDocuments from "./UploadDocuments/UploadDocuments";
import { useNavigate } from "react-router-dom";
import PatientList from "./PatientList/PatientList";
import AddPatient from "./AddPatient/AddPatient";
import GraphVisualisation from "../GraphVisualisation/GraphVisualisation";
import { Header } from "antd/es/layout/layout";
import axios from "axios";
import dayjs from "dayjs";
import N3 from "n3";
import rdfParser from "rdf-parse";
import Rectangle from "../GraphVisualisation/Rectangle/Rectangle";

const DoctorDashboard = () => {
  const { Content, Footer, Sider } = Layout;
  const [collapsed, setCollapsed] = useState(false);
  const [selectedItem, setSelectedItem] = useState("1");
  const { dashboardItems, setDashboardItems } = useContext(GlobalContext);
  const [spetialite, setSpetialite] = useState("");
  const [lieuCon, setLieu] = useState("");
  const [legendData, setLegendData] = useState([
    { label: "Pdf", color: "#B3A492" },
    { label: "Image", color: "#DADDB1" },
    { label: "CSV", color: "#A7D397" },
    { label: "Patient", color: "lightblue" },
    { label: "Filtrate", color:"green" },
    { label: "Display", color: "#b00d49" },
    { label: "Extract", color: "#DB7093" },
    { label: "Abstract", color:"#6495ED" },
    { label: "Transform", color: "#DAA520" },
    { label: "Class", color: "#DCDCDC" },
    { label: "Word", color: "#D8BFD8" },
    { label: "Column", color: "#3271e7" },


    

    



    



    



  


  



    // Add more legend items as needed
  ]);
  let email = JSON.parse(sessionStorage.getItem("user"))?.email;
  const [graphData, setGraphData] = useState({ nodes: [], edges: [] });
  const { loading, setLoading } = useContext(GlobalContext);
  const [listTypes, setListTypes] = useState([]);
  const [predictPatient, setPredictPatient] = useState(false);
  // const [selectedItem, setSelectedItem] = useState("1");
  const [filtrate, setFiltrate] = useState(false);
  const [dateDebut, setDateDebut] = useState();
  const [contenuType, setContenuType] = useState(false);
  const [dateFin, setDateFin] = useState();
  const [contenuChoisi, setContenuChoisi] = useState();
  const [histogramData, setHistogramData] = useState({});
  const [queryName, setQueryName] = useState([]);
  const labels = ["Min", "Max", "Average"];
  const [rdfGraph, setRdfGraph] = useState({ nodes: [], edges: [] });
  // const values = [data.min, data.max, data.avg];

  const onChangeContenu = (e) => {
    setContenuChoisi(e);
  };
  const classify_document = (filename) => {
    const file_extension = filename
      ? filename
          .split(".")
          .pop()
          .toLowerCase()
      : "";
    if (file_extension === "pdf") {
      return "#B3A492";
    } else if (["jpg", "jpeg", "png", "gif", "bmp"].includes(file_extension)) {
      return "#DADDB1";
    } else if (["xlsx", "xls", "csv", "xlsm"].includes(file_extension)) {
      return "#A7D397";
    } else if (["mp4", "avi", "mkv"].includes(file_extension)) {
      return "#BEADFA";
    } else {
      return "#D8BFD8";
    }
  };

  useEffect(() => {
    if (selectedItem === "2-5") {
      transformToJSONLD(graphData.nodes, graphData.links);
    }

    if (selectedItem === "3.3") {
      setDashboardItems("default");
      setSelectedItem("1");
    }
  }, [selectedItem]);

  const sendJSONLDToBackend = async (jsonLDData) => {
    try {
      const response = await axios.post(
        "http://127.0.0.1:5000/patient/transformToRDF",
        jsonLDData,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const { Parser, NamedNode, DefaultGraph, Literal } = N3;
      if (response.status === 200) {
        const rdfTriples = [];

        const parser = new Parser();

        parser.parse(response.data, (error, quad, prefixes) => {
          if (error) {
          } else if (quad) {
            const triple = {
              subject:
                quad.subject instanceof NamedNode ? quad.subject.value : "",
              predicate:
                quad.predicate instanceof NamedNode ? quad.predicate.value : "",
              object:
                quad.object instanceof NamedNode
                  ? quad.object.value
                  : quad.object.value,
            };

            rdfTriples.push(triple);
          } else {
            // Extract labels before mapping
            const nodeLabels = {};
            const edgeLabels = {};

            rdfTriples.forEach((triple) => {
              const { subject, predicate, object } = triple;

              // Extract label for nodes
              if (
                predicate ===
                  "http://www.w3.org/1999/02/22-rdf-syntax-ns#type" &&
                object !== "http://semanticweb.org/neo4j/edge"
              ) {
                const labelTriple = rdfTriples.find(
                  (t) =>
                    t.subject === subject &&
                    t.predicate === "http://semanticweb.org/neo4j/label"
                );

                if (labelTriple && labelTriple.object) {
                  nodeLabels[subject] = labelTriple.object;
                }
              }

              // Extract label for edges
              if (predicate === "http://semanticweb.org/neo4j/edge") {
                const labelTriple = rdfTriples.find(
                  (t) =>
                    t.subject === subject &&
                    t.predicate === "http://semanticweb.org/neo4j/label"
                );

                if (labelTriple && labelTriple.object) {
                  edgeLabels[subject] = labelTriple.object;
                }
              }
            });
            // Now you have extracted labels, proceed to mapping
            const nodes = rdfTriples
              .filter(
                (triple) =>
                  triple.predicate ===
                    "http://www.w3.org/1999/02/22-rdf-syntax-ns#type" &&
                  triple.object !== "http://semanticweb.org/neo4j/edge"
              )
              .map((triple) => {
                const { subject, object } = triple;
                const lastSubject = subject.split("/");
                const lastPart = lastSubject[lastSubject.length - 1];
                const label = nodeLabels[subject] || `Unknown (${lastPart})`;
                return {
                  id: lastPart,
                  type: object,
                  label,
                  info: { name: label },
                };
              });

            const edges = rdfTriples
              .filter(
                (triple) =>
                  triple.predicate === "http://semanticweb.org/neo4j/edge"
              )
              .map((triple) => {
                const { subject, object } = triple;
                const lastSubject = subject.split("/");
                const lastPart = lastSubject[lastSubject.length - 1];
                const lastObject = object.split("/");
                const lastPartObject = lastObject[lastObject.length - 1];
                const edgeLabel = edgeLabels[subject] || "Edge";
                return { from: lastPart, to: lastPartObject, label: edgeLabel };
              });
            setLoading(false);
            // Now you have nodes and edges with labels, you can use them as needed
            const transformedData = transformGraphData({ nodes, edges });
            setGraphData(transformedData);
          }
        });
      } else {
        console.error(
          "Error sending JSON-LD data to the backend:",
          response.statusText
        );
      }
    } catch (error) {
      console.error("Error sending JSON-LD data to the backend:", error);
    }
  };

  const transformToJSONLD = (nodes, edges) => {
    setLoading(true);

    const jsonLDData = {
      "@context": {
        label: "http://www.w3.org/2000/01/rdf-schema#label",
        type: "@type",
        nodes: "http://example.org/graph#nodes",
        edges: "http://example.org/graph#edges",
      },
      nodes: nodes.map((node) => ({
        id: node.id,
        label: node.label,
        type: "Node",
      })),
      edges: edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: "edge",
        // label: edge.label,
      })),
    };

    sendJSONLDToBackend(jsonLDData);
  };

  const getVersions = () => {
    setLoading(true);
    axios
      .get(`http://127.0.0.1:5000/versions/${email}`)
      .then((res) => {
        const transformedData = transformGraphData(res.data);
        setGraphData(transformedData);
        setLoading(false);
      })
      .catch((error) => {
        setLoading(false);
        console.error("Error fetching versions:", error);
      });
  };
  const getItem = (label, key, icon) => ({
    key: key,
    icon: icon,
    label: label,
  });
  const items =
    dashboardItems === "default"
      ? [
          getItem("Liste des patients", "1", <UserOutlined />),
          getItem("Ajouter patient", "2", <UserOutlined />),
          getItem("Se déconnecter", "3", <LogoutOutlined />),
        ]
      : [
          {
            key: "1",
            label: "Synthèse des données",
            icon: <PieChartOutlined />,
            children: [
              getItem("Synthèse basique", "2-1", <PieChartOutlined />),
              {
                key: "2-2",
                label: "Synthèse avancée",
                icon: <FileTextOutlined />,
                children: [
                  getItem("Synthèse par date", "2-2-1", <CalendarOutlined />),
                  getItem(
                    "Synthèse par localité",
                    "2-2-2",
                    <EnvironmentOutlined />
                  ),
                  getItem(
                    "Synthèse par spécialité",
                    "2-2-3",
                    <MedicineBoxOutlined />
                  ),
                ],
              },

              {
                key: "2-3",
                label: "Synthèse basée sur le contenu",
                icon: <FileTextOutlined />,
                children: [
                  {
                    key: "2-3-1",
                    label: "Synthèse textuelle",
                    children: [
                      getItem(
                        "Synthése extractive",
                        "2-3-1-1",
                        <BarChartOutlined />
                      ),
                      getItem(
                        "Synthése abstractive",
                        "2-3-1-2",
                        <BarChartOutlined />
                      ),
                      getItem(
                        "Synthése basée sur openai",
                        "2-3-1-3",
                        <BarChartOutlined />
                      ),
                    ],
                  },
                  getItem("Synthèse numérique", "2-3-2", <FileExcelOutlined />),
                ],
              },

              // getItem("Synthèse numérique", "2-4", <FileExcelOutlined />),
              getItem("Modélisation sémantique", "2-5", <LineChartOutlined />),
            ],
          },
          getItem("versionning", "3", <UserOutlined />),

          getItem("Liste des patients", "3.3", <UserOutlined />),
          getItem("Se déconnecter", "4", <LogoutOutlined />),

          // getItem("RDF","5")
        ];

  const navigate = useNavigate();
  const Logout = () => {
    navigate("/login");
    localStorage.clear();
    sessionStorage.clear();
    setDashboardItems("default");
  };

  const getGraphByContenu = () => {
    setLoading(true);

    contenuChoisi !== "openAi"
      ? axios
          .post(`http://127.0.0.1:5000/topic/multiple`, {
            email: email,
            algo: contenuChoisi,
          })
          .then((res) => {
            setLoading(false);

            const transformedData = transformGraphData(res.data);
            setGraphData(transformedData);

            if (contenuChoisi === "CSV") {
              let columnsHistogramData = {};

              transformedData.nodes.forEach((node) => {
                // if (node.group === "Column") {
                const columnId = node.id;
                const minNode = transformedData.nodes.find(
                  (n) => n.id === `Min_${columnId}`
                );

                const maxNode = transformedData.nodes.find(
                  (n) => n.id === `Max_${columnId}`
                );
                const avgNode = transformedData.nodes.find(
                  (n) => n.id === `Average_${columnId}`
                );

                if (minNode && maxNode && avgNode) {
                  columnsHistogramData[columnId] = {
                    labels: ["Min", "Max", "Average"],
                    datasets: [
                      {
                        label: node.info.name,
                        backgroundColor: [
                          "rgba(255, 99, 132, 0.2)",
                          "rgba(54, 162, 235, 0.2)",
                          "rgba(255, 206, 86, 0.2)",
                        ],
                        borderColor: [
                          "rgba(255, 99, 132, 1)",
                          "rgba(54, 162, 235, 1)",
                          "rgba(255, 206, 86, 1)",
                        ],
                        borderWidth: 1,
                        data: [
                          minNode.info.name,
                          maxNode.info.name,
                          avgNode.info.name,
                        ],
                      },
                    ],
                  };
                  // }
                }
              });

              setHistogramData(columnsHistogramData);
            }
          })
          .catch((e) => {
            setLoading(false);

            console.log(e);
          })
      : axios
          .post("http://127.0.0.1:5000/getOpenAiSummarize", {
            email: email,
          })
          .then((res) => {
            setLoading(false);

            const transformedData = transformGraphData(res.data);
            setGraphData(transformedData);
            let summaries=[]



            transformedData?.nodes?.map((node)=>{
              if(node.label==="Summary"){
                console.log("node",node);
               summaries.push({
                "id":node.id,
                "summary":node.info.name,
               })
              }
            })

            sessionStorage.setItem("summaries",JSON.stringify(summaries))



      
          });
  };
  // const onClickNode = (node) => {
  //   console.log(node);
  //   axios
  //     .get(`http://127.0.0.1:5000/get_node_info/${node}`)
  //     .then((res) => {
  //       //  if(res.data?.labels[0]==="Filtrate"){
  //       //   axios.get(`/document_types_graph?patient_email=${email}`).then((res)=>{
  //       //     const transformedData = transformGraphData(res.data);
  //       //       // console.log(res.data);
  //       //       setGraphData(transformedData);
  //       //   })
  //       //  }

  //       if (res.data?.labels[0] === "Patient") {
  //         setPredictPatient(true);
  //       }

  //       if (res.data.labels[0] === "Document") {
  //         fetch(res.data.properties.filepath)
  //           .then((response) => response.blob())
  //           .then((blob) => {
  //             return new Promise((resolve, reject) => {
  //               const reader = new FileReader();
  //               reader.onloadend = () => resolve(reader.result);
  //               reader.onerror = reject;
  //               reader.readAsDataURL(blob);
  //             });
  //           });
  //         // console.log("lkj",res.data);
  //       }

  //       if (res.data.labels[0] === "Version") {
  //         console.log(JSON.parse(res.data.properties.version));
  //         const transformedData = transformGraphData({
  //           nodes: JSON.parse(res.data.properties.version).nodes,
  //           edges: JSON.parse(res.data.properties.version).edges,
  //         });
  //         setGraphData(transformedData);
  //       }
  //     })
  //     .catch((e) => {
  //       console.log(e);
  //     });
  // };

  const getGraphByType = () => {
    setLoading(true);
    axios
      .get(
        `http://127.0.0.1:5000/document_types_graph?patient_email=${email}&document_types=${listTypes}`
      )
      .then((res) => {
        setLoading(false);

        const transformedData = transformGraphData(res.data);
        // console.log(res.data);
        setGraphData(transformedData);
      })
      .catch(() => {
        setLoading(false);
      });
  };

  const transformGraphData = (apiResponse) => {

    const addedFiltrateNodes = new Set(); // Track Filtrate nodes that have been added
    const nodes = apiResponse.nodes.map((node) => ({
      id: node.id,
      label: node.label || "Unknown",
      group: "patient",
      color:
        node.group === "patient"
          ? "lightblue"
          : node.group === "filtrate"
          ? "green"
          : node.group === "display"
          ? "#b00d49"
          : node.group === "Column"
          ? "#3271e7"
          : node.group === "class"
          ? "#DCDCDC"
          : node.group === "Extract"
          ? "#DB7093"
          : node.group === "Abstract"
          ? "#6495ED"
          : node.group === "Transformate"
          ? "#DAA520"
          : classify_document(node.label),
      symbolType:
        node.group === "filtrate" ||
        node.group === "display" ||
        node.group === "Extract" ||
        node.group === "Abstract" ||
        node.group === "Transformate"
          ? "diamond"
          
          : "",
      size:
        node.group === "summary"
          ? node?.info?.name.length * 20
          : node.group === "filtrate" || node.group === "display"
          ? 700
          : 3000,
      labelText:
        node.group === "patient"
          ? `${node.info.nom} ${node.info.prenom}`
          : node.group === "filtrate"
          ? "Filtrate"
          : node.group === "display"
          ? "Display"
          : node.group === "summary"
          ? node.info.name.slice(0,30) + "..."
          : node?.info
          ? node?.info?.name
          
          : "",
      info: node.info,
      nodeLabel: {
        wrapText: true, // Enable text wrapping for node labels
        fontSize: 10, // Adjust font size as needed
        fontWeight: "normal", // Adjust font weight as needed
        fontFamily: "Arial, sans-serif", // Adjust font family as needed
        lineHeight: 1.2, // Adjust line height as needed
        padding: 8, // Add padding to the node label container
        width: 200, // Set a fixed width for the node label container
        textAlign: "center", // Center-align the text within the node label container
      },
    }));

    const links = apiResponse?.edges
      ?.map((edge) => {
        if (edge.label === "HAS_FILTRATE" && addedFiltrateNodes.has(edge.to)) {
          return null; // Skip adding edge for duplicate Filtrate nodes
        }

        if (edge.label === "HAS_FILTRATE") {
          addedFiltrateNodes.add(edge.to); // Add Filtrate node to the set
        }
        if (edge.label === "HAS_DISPLAY" && addedFiltrateNodes.has(edge.to)) {
          return null; // Skip adding edge for duplicate Filtrate nodes
        }

        if (edge.label === "HAS_DISPLAY") {
          addedFiltrateNodes.add(edge.to); // Add Filtrate node to the set
        }
        if (
          edge.label.includes("CONTAINS with") &&
          addedFiltrateNodes.has(edge.to)
        ) {
          return null;
        }
        if (edge.label.includes("CONTAINS with")) {
          addedFiltrateNodes.add(edge.to); // Add Filtrate node to the set
        }
        if (edge.label.includes("has") && addedFiltrateNodes.has(edge.to)) {
          return null;
        }
        if (edge.label.includes("has")) {
          addedFiltrateNodes.add(edge.to); // Add Filtrate node to the set
        }
        if (edge.label.includes("Extract") && addedFiltrateNodes.has(edge.to)) {
          return null;
        }
        if (edge.label.includes("Extract")) {
          addedFiltrateNodes.add(edge.to); // Add Filtrate node to the set
        }

        return {
          id: `${edge.from}-${edge.to}`,
          source: edge?.from,
          target: edge?.to,
          value: 1,
          label: edge.label,
        };
      })
      .filter((edge) => edge !== null); // Remove null entries (skipped edges)

    return { nodes, links };
  };

  function onMouseOverLink(link) {
    // Set the color to a different color when hovering
    link.color = "orange";
  }

  // Callback when mouse out of a link
  function onMouseOutLink(link) {
    // Reset the color when hover state is removed
    link.color = "lightblue";
  }

  // const graphConfig = {
  //   directed: true,
  //   node: {
  //     color: "lightblue",
  //     size: 500,
  //     highlightStrokeColor: "blue",
  //     renderLabel: true,
  //     labelProperty: "labelText",
  //     labelPosition: "center",
  //     wordWrap: true,
  //     onClick: onClickNode,
  //   },
  //   d3: {
  //     alphaTarget: 0.05,
  //     gravity: -250,
  //     linkLength: 120,
  //     linkStrength: 2,
  //     disableLinkForce: false,
  //     // Specify the hierarchy layout
  //     nodeSpacing: 300, // Adjust the spacing between nodes
  //     treeSpacing: 300, // Adjust the spacing between branches of the tree
  //     nodePadding: 5, // Adjust the padding between nodes
  //   },
  //   link: {
  //     highlightColor: "lightblue",
  //     renderLabel: true,
  //     fontSize: 5,
  //     markerWidth: 6,
  //     selfLinkDirection: "TOP_RIGHT",
  //     onMouseOverLink: onMouseOverLink,
  //     onMouseOutLink: onMouseOutLink,
  //   },
  // };

  const handleSwitchChange = (type) => {
    if (!listTypes.includes(type)) {
      setListTypes((prevListTypes) => {
        const updatedList = [...prevListTypes, type];
        return updatedList;
      });
    } else {
      setListTypes((prevListTypes) => {
        const updatedList = prevListTypes.filter((item) => item !== type);
        return updatedList;
      });
    }
  };

  const getGraphByDate = (type) => {
    setLoading(true);
    let params = {
      patient_email: email,
      type: type,
    };

    if (type === "date") {
      params.start_date = dateDebut;
      params.end_date = dateFin;
    } else if (type === "spetialite") {
      params.spetialite = spetialite;
    } else if (type === "locality") {
      params.locality = lieuCon;
    }

    axios
      .get("/documents_by_criteria", {
        params: params,
      })
      .then((res) => {
        const transformedData = transformGraphData(res.data);
        setGraphData(transformedData);
        setLoading(false);
      })
      .catch((error) => {
        setLoading(false);
      });
  };

  return (
    <>
      {/* <Header /> */}
      <ConfigProvider
        theme={{
          components: {
            Layout: {
              siderBg: "#F9F9F9",
            },
          },
        }}
      >
        <Layout
          style={{
            minHeight: "100vh",
            // display: "flex",
            // flexDirection: "column",
          }}
        >
          <Sider
            collapsible
            collapsed={collapsed}
            onCollapse={(value) => setCollapsed(value)}
            width="320"
            style={{
              display: "flex",
              flexDirection: "column",
              height: "100vh",
            }}
          >
            <div className="demo-logo-vertical" />

            <Row
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                marginBlock: "2rem",
              }}
            >
              <Avatar
                style={{ backgroundColor: "#2d6c8c", marginBottom: "0.5rem" }}
                icon={<UserOutlined />}
              />
              {dashboardItems === "default"
                ? "Doctor"
                : JSON.parse(sessionStorage.getItem("user"))?.nom +
                  " " +
                  JSON.parse(sessionStorage.getItem("user"))?.prenom}
            </Row>

            <Menu
              defaultSelectedKeys={selectedItem}
              onSelect={(item) => {
                setSelectedItem(item.key);
              }}
              mode="inline"
              items={items}
              style={{ flex: 1 }} // Expand to fill remaining space
            />

            {(selectedItem === "1" ||
              selectedItem === "2-1" ||
              selectedItem === "2-2" ||
              selectedItem === "2-3" ||
              selectedItem === "2-4" ||
              selectedItem === "4" ||
              selectedItem === "2-3-1" ||
              selectedItem === "2-3-2" ||
              selectedItem === "2-2-1" ||
              selectedItem === "2-2-2" ||
              selectedItem === "2-2-3" ||
              selectedItem === "2-3-1-1" ||
              selectedItem === "2-3-1-2" ||
              selectedItem === "2-3-1-3") &&
              dashboardItems !== "default" && (
                <div style={{ marginLeft: "1rem", marginBottom: "2rem" ,maxWidth:"320px"}}>
                  <h3>Légende explicative de DEP</h3>
                  <ul
                   style={{
                    display: "flex",
                    flexWrap: "wrap", // Allow items to wrap to the next line
                    alignItems: "center",
                    listStyleType: "none", // Remove default list styles
                    padding: 0,
                    maxWidth: "320px",
                    marginBottom:"1rem"
                }}
                  >
                    {legendData.map((item, index) => (
                      <li
                        key={index}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          marginRight: "1rem",
                          marginTop:"0.5rem"
                        }}
                      >
                        <span
                          style={{
                            display: "inline-block",
                            width: "20px",
                            height: "20px",
                            marginRight: "0.5rem",
                            color: item.color,
                            backgroundColor: item.color,
                          }}
                        >
                          &#9632;
                        </span>{" "}
                        {item.label}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
          </Sider>

          <Layout>
            {(selectedItem === "2-1" ||
              selectedItem === "2-2" ||
              selectedItem === "2-3" ||
              selectedItem === "2-4" ||
              selectedItem === "4" ||
              selectedItem === "2-3-1" ||
              selectedItem === "2-3-2" ||
              selectedItem === "2-2-1" ||
              selectedItem === "2-2-2" ||
              selectedItem === "2-2-3" ||
              selectedItem === "2-3-1-1" ||
              selectedItem === "2-3-1-2" ||
              selectedItem === "2-3-1-3") && (
              <Header
                style={{
                  display: "flex",
                  textAlign: "center",
                }}
              >
                <Menu
                  theme="light"
                  mode="horizontal"
                  defaultSelectedKeys={["2"]}
                  // items={itemsNav}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  {selectedItem === "2-1" && (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "row",
                        justifyContent: "start",
                        width: "100%",
                      }}
                    >
                      <Button
                        style={{
                          backgroundColor: listTypes.includes("PDF")
                            ? "#C7D2DC"
                            : "transparent",
                          border: "none",
                        }}
                        onClick={() => handleSwitchChange("PDF")}
                      >
                        <FilePdfOutlined />
                        Synthètiser les fichiers textuels
                      </Button>
                      <Button
                        style={{
                          backgroundColor: listTypes.includes("CSV")
                            ? "#C7D2DC"
                            : "transparent",
                          border: "none",
                          marginInline: "2rem",
                        }}
                        onClick={() => handleSwitchChange("CSV")}
                      >
                        <FileExcelOutlined />
                        Synthètiser les fichiers numériques
                      </Button>
                      <Button
                        style={{
                          backgroundColor: listTypes.includes("IMAGE")
                            ? "#C7D2DC"
                            : "transparent",
                          border: "none",
                        }}
                        onClick={() => handleSwitchChange("IMAGE")}
                      >
                        <FileImageOutlined />
                        Synthètiser les fichiers de type image
                      </Button>
                      <Button
                        onClick={getGraphByType}
                        style={{ marginInline: "2rem" }}
                      >
                        <SearchOutlined />
                      </Button>
                    </div>
                  )}

                  {selectedItem === "2-2-1" && (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "row",
                        justifyContent: "start",
                        width: "100%",
                      }}
                    >
                      <DatePicker
                        placeholder="date de début"
                        onChange={(e) =>
                          setDateDebut(dayjs(e).format("YYYY-MM-DD"))
                        }
                      />
                      <DatePicker
                        placeholder="date de fin"
                        onChange={(e) =>
                          setDateFin(dayjs(e).format("YYYY-MM-DD"))
                        }
                      />

                      <Button onClick={() => getGraphByDate("date")}>
                        <SearchOutlined />
                      </Button>
                    </div>
                  )}
                  {selectedItem === "2-2-2" && (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "row",
                        justifyContent: "start",
                        width: "100%",
                      }}
                    >
                      <Input
                        placeholder="loclaité"
                        onChange={(e) => setLieu(e.target.value)}
                      />

                      <Button onClick={() => getGraphByDate("locality")}>
                        <SearchOutlined />
                      </Button>
                    </div>
                  )}
                  {selectedItem === "2-2-3" && (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "row",
                        justifyContent: "start",
                        width: "100%",
                      }}
                    >
                      <Input
                        placeholder="spécialité"
                        onChange={(e) => setSpetialite(e.target.value)}
                      />

                      <Button onClick={() => getGraphByDate("spetialite")}>
                        <SearchOutlined />
                      </Button>
                    </div>
                  )}
                  {selectedItem === "2-3-1-1" && (
                    <div
                      style={{
                        width: "100%",
                      }}
                    >
                      <Button
                        style={{
                          backgroundColor:
                            contenuChoisi === "LDA" ? "#C7D2DC" : "transparent",
                          border: "none",
                        }}
                        onClick={() => onChangeContenu("LDA")}
                      >
                        <FileImageOutlined />
                        Identifier les thèmes latents dans un document.
                      </Button>
                      <Button
                        style={{
                          backgroundColor:
                            contenuChoisi === "HLDA"
                              ? "#C7D2DC"
                              : "transparent",
                          // marginInline:"0.5rem",
                          border: "none",
                        }}
                        onClick={() => onChangeContenu("HLDA")}
                      >
                        <FilePdfOutlined />
                        Catégoriser automatiquement les topics les plus
                        importants.
                      </Button>

                      {/* <Button
                style={{
                  backgroundColor:
                    contenuChoisi === "CSV" ? "#C7D2DC" : "transparent",
                }}
                onClick={() => onChangeContenu("CSV")}
              >
                <FileExcelOutlined />
                Synthèse numérique
              </Button> */}

                      <Button onClick={getGraphByContenu}>
                        <SearchOutlined />
                      </Button>
                    </div>
                  )}

                  {selectedItem === "2-3-1-2" && (
                    <div
                      style={{
                        width: "100%",
                      }}
                    >
                      <Button
                        style={{
                          backgroundColor:
                            contenuChoisi === "GRAPH_BASED_PG"
                              ? "#C7D2DC"
                              : "transparent",
                          border: "none",
                        }}
                        onClick={() => onChangeContenu("GRAPH_BASED_PG")}
                      >
                        <FileExcelOutlined />
                        Synthèse basée sur la prédiction(Graph based)
                      </Button>

                      <Button
                        style={{
                          backgroundColor:
                            contenuChoisi === "TREE_BASED"
                              ? "#C7D2DC"
                              : "transparent",
                          marginBlock: "1rem",
                          // marginInline:"0.5rem",
                          border: "none",
                        }}
                        onClick={() => onChangeContenu("TREE_BASED")}
                      >
                        <FileExcelOutlined />
                        Synthèse basée sur la prédiction(Tree based)
                      </Button>
                      <Button onClick={getGraphByContenu}>
                        <SearchOutlined />
                      </Button>
                    </div>
                  )}

                  {selectedItem === "2-3-2" && (
                    <div
                      style={{
                        width: "100%",
                      }}
                    >
                      <Button
                        style={{
                          backgroundColor:
                            contenuChoisi === "CSVMax"
                              ? "#C7D2DC"
                              : "transparent",
                          border: "none",
                        }}
                        onClick={() => onChangeContenu("CSVMax")}
                      >
                        <FileImageOutlined />
                        Synthètiser la mesure maximale
                      </Button>
                      <Button
                        style={{
                          backgroundColor:
                            contenuChoisi === "CSVMin"
                              ? "#C7D2DC"
                              : "transparent",
                          marginInline: "0.5rem",
                          border: "none",
                        }}
                        onClick={() => onChangeContenu("CSVMin")}
                      >
                        <FilePdfOutlined />
                        Synthètiser la mesure minimale
                      </Button>

                      <Button
                        style={{
                          backgroundColor:
                            contenuChoisi === "CSVAvg"
                              ? "#C7D2DC"
                              : "transparent",
                          border: "none",
                        }}
                        onClick={() => onChangeContenu("CSVAvg")}
                      >
                        <FileExcelOutlined />
                        Synthètiser la mesure moyenne
                      </Button>
                      {/* <Button
                        style={{
                          backgroundColor:
                            contenuChoisi === "TREE_BASED"
                              ? "#C7D2DC"
                              : "transparent",
                          marginBlock: "1rem",
                          marginInline: "0.5rem",
                          border: "none",
                        }}
                        // onClick={() => onChangeContenu("TREE_BASED")}
                      >
                        <FileExcelOutlined />
                        Synthètiser une courbe de variation des mesures à
                        interpréter
                      </Button> */}

                      <Button onClick={getGraphByContenu}>
                        <SearchOutlined />
                      </Button>
                    </div>
                  )}
                  {selectedItem === "2-3-1-3" && (
                    <div style={{ width: "100%" }}>
                      <Button
                        style={{
                          backgroundColor:
                            contenuChoisi === "openAi"
                              ? "#C7D2DC"
                              : "transparent",
                          border: "none",
                        }}
                        onClick={() => onChangeContenu("openAi")}
                      >
                        <FileExcelOutlined />
                        OpenAi
                      </Button>
                      <Button onClick={getGraphByContenu}>
                        <SearchOutlined />
                      </Button>
                    </div>
                  )}

                  {selectedItem === "4" && !loading && (
                    <div
                      style={{
                        marginTop: "2rem",
                        display: "flex",
                        flexDirection: "row",
                        width: "100%",
                        margin: "0 auto",
                      }}
                    >
                      <Button onClick={getVersions}>
                        <ArrowLeftOutlined />
                      </Button>
                    </div>
                  )}
                </Menu>
              </Header>
            )}
            <Content
              style={{
                margin: "0 16px",
                display: "flex",
                justifyContent: "center",
              }}
            >
              {selectedItem === "1" && dashboardItems === "default" && (
                <PatientList />
              )}
              {dashboardItems !== "default" && (
                <GraphVisualisation
                  email={JSON.parse(sessionStorage.getItem("user"))?.email}
                  selectedItem={selectedItem}
                  graphData={graphData}
                  setGraphData={setGraphData}
                  rdfGraph={rdfGraph}
                  onChangeContenu={onChangeContenu}
                  getGraphByContenu={getGraphByContenu}
                />
              )}
              {selectedItem === "2" && dashboardItems === "default" && (
                <AddPatient />
              )}
              {dashboardItems === "default"
                ? selectedItem === "3" && Logout()
                : selectedItem === "4" && Logout()}
            </Content>
            <Footer
              style={{
                textAlign: "center",
              }}
            >
              
            </Footer>
          </Layout>
        </Layout>
      </ConfigProvider>
    </>
  );
};

export default DoctorDashboard;
